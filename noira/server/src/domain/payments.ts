/* ============================================================
   Zahlungen

   Aufgeteilt in zwei Schichten, weil der Anbieter wechseln wird und
   die Regeln nicht:

   • `PaymentProvider` ist die Schnittstelle: Zahlung eröffnen,
     Ereignis prüfen. Datatrans (Karte, TWINT) und BTCPay (Krypto)
     passen beide dahinter.
   • Alles darunter — Betrag rechnen, Bestellung führen, Inserat
     freischalten — gehört uns und wird hier getestet.

   Zwei Dinge, an denen Zahlungsanbindungen üblicherweise scheitern
   und die darum ausdrücklich gelöst sind:

   1. Beträge rechnet der Server. Was der Browser schickt, ist ein
      Wunsch, kein Preis.
   2. Ereignisse kommen doppelt. `provider_event_id` ist eindeutig;
      ein zweites Mal geliefertes „bezahlt" verlängert die Laufzeit
      nicht ein zweites Mal.
   ============================================================ */

import crypto from "node:crypto";
import { all, one, run, tx } from "../db/index.js";
import { env } from "../env.js";
import { badRequest, forbidden, notFound, nowIso, plusMinutes } from "../lib/http.js";
import { newId } from "../lib/ids.js";
import { activate } from "./ads.js";
import { extendRetention } from "./verification.js";
import { priceOrder, type Duration, type PlanId } from "./catalog.js";

export type Method = "card" | "twint" | "crypto";

export type Order = {
  id: string;
  account_id: string;
  listing_id: string | null;
  plan: PlanId;
  duration_days: Duration;
  amount_net: number;
  vat_rate_bp: number;
  vat_amount: number;
  amount_total: number;
  currency: string;
  method: Method;
  status: "created" | "pending" | "paid" | "failed" | "expired" | "refunded";
  provider: string;
  provider_ref: string | null;
  crypto_asset: string | null;
  crypto_amount: string | null;
  rate_locked_until: string | null;
  invoice_email: string;
  invoice_address: string | null;
  created_at: string;
  paid_at: string | null;
  failed_reason: string | null;
};

/* --- Anbieter-Schnittstelle --------------------------------------- */

export type CheckoutSession = {
  providerRef: string;
  /** Wohin die Kundschaft geschickt wird (3-D Secure, TWINT-App, Wallet). */
  redirectUrl?: string;
  /** Bei Krypto: Adresse, Betrag, Netz und Kursfrist. */
  crypto?: { address: string; amount: string; asset: string; network: string; expiresAt: string };
};

export type ProviderEvent = {
  providerEventId: string;
  type: "payment.succeeded" | "payment.failed" | "payment.expired";
  providerRef: string;
  reason?: string;
};

export interface PaymentProvider {
  readonly name: string;
  openCheckout(order: Order, opts: { asset?: string }): CheckoutSession;
  /** Prüft Signatur und Form. Wirft, wenn etwas nicht stimmt. */
  parseEvent(rawBody: string, headers: Record<string, string | string[] | undefined>): ProviderEvent;
}

/* Demo-Kurse. In Produktion liefert sie der Anbieter mit einer
   Kursgarantie; hier fest, damit Tests reproduzierbar sind. */
const CRYPTO_RATES: Record<string, { rappen: number; network: string; decimals: number }> = {
  btc: { rappen: 5_840_000, network: "Bitcoin", decimals: 6 },
  eth: { rappen: 295_000, network: "ERC-20", decimals: 5 },
  usdt: { rappen: 88, network: "TRC-20", decimals: 2 },
};

/**
 * Anbieter für die Entwicklung. Verhält sich wie ein echter — gleiche
 * Schnittstelle, signierte Ereignisse —, bewegt aber kein Geld.
 */
export const mockProvider: PaymentProvider = {
  name: "mock",

  openCheckout(order, opts) {
    const ref = `mock_${crypto.randomBytes(9).toString("hex")}`;
    if (order.method === "crypto") {
      const asset = (opts.asset ?? "btc").toLowerCase();
      const rate = CRYPTO_RATES[asset];
      if (!rate) throw badRequest(`Unbekannte Kryptowährung: ${asset}`);
      return {
        providerRef: ref,
        crypto: {
          address: `demo-${asset}-${crypto.randomBytes(8).toString("hex")}`,
          amount: (order.amount_total / rate.rappen).toFixed(rate.decimals),
          asset: asset.toUpperCase(),
          network: rate.network,
          expiresAt: plusMinutes(15),
        },
      };
    }
    return { providerRef: ref, redirectUrl: `${env.PUBLIC_ORIGIN}/kasse/weiterleitung?ref=${ref}` };
  },

  parseEvent(rawBody, headers) {
    const secret = env.PAYMENT_WEBHOOK_SECRET;
    if (secret) {
      const given = String(headers["x-noira-signature"] ?? "");
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      const a = Buffer.from(given);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b))
        throw forbidden("Signatur stimmt nicht.");
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      throw badRequest("Kein gültiges JSON.");
    }
    const type = String(body.type ?? "");
    if (!["payment.succeeded", "payment.failed", "payment.expired"].includes(type))
      throw badRequest(`Unbekannter Ereignistyp: ${type}`);
    if (!body.id || !body.providerRef) throw badRequest("id und providerRef sind Pflicht.");
    return {
      providerEventId: String(body.id),
      type: type as ProviderEvent["type"],
      providerRef: String(body.providerRef),
      reason: body.reason ? String(body.reason) : undefined,
    };
  },
};

const providers: Record<string, PaymentProvider> = { mock: mockProvider };

export function providerFor(name: string = env.PAYMENT_PROVIDER): PaymentProvider {
  const p = providers[name];
  if (!p) {
    // Ehrlich scheitern statt still auf die Demo zurückfallen: Eine
    // Bestellung, die niemand kassiert, ist schlimmer als ein Fehler.
    throw new Error(
      `Zahlungsanbieter "${name}" ist nicht angebunden. Verfügbar: ${Object.keys(providers).join(", ")}`,
    );
  }
  return p;
}

export function registerProvider(p: PaymentProvider) {
  providers[p.name] = p;
}

/* --- Bestellungen -------------------------------------------------- */

export function createOrder(input: {
  accountId: string;
  listingId: string | null;
  plan: PlanId;
  duration: Duration;
  method: Method;
  email: string;
  asset?: string;
  address?: unknown;
}) {
  if (input.listingId) {
    const owner = one<{ account_id: string }>("SELECT account_id FROM listings WHERE id = ?", [
      input.listingId,
    ]);
    if (!owner) throw notFound("Inserat nicht gefunden.");
    if (owner.account_id !== input.accountId) throw forbidden("Das ist nicht Ihr Inserat.");
  }

  // Der Preis kommt aus dem Katalog, nie aus der Anfrage.
  const price = priceOrder(input.plan, input.duration);
  const id = newId("ord");
  const provider = providerFor();

  const order: Order = {
    id,
    account_id: input.accountId,
    listing_id: input.listingId,
    plan: input.plan,
    duration_days: input.duration,
    amount_net: price.net,
    vat_rate_bp: price.vatRateBp,
    vat_amount: price.vat,
    amount_total: price.total,
    currency: "CHF",
    method: input.method,
    status: "created",
    provider: provider.name,
    provider_ref: null,
    crypto_asset: input.asset ?? null,
    crypto_amount: null,
    rate_locked_until: null,
    invoice_email: input.email.trim().toLowerCase(),
    invoice_address: input.address ? JSON.stringify(input.address) : null,
    created_at: nowIso(),
    paid_at: null,
    failed_reason: null,
  };

  const session = provider.openCheckout(order, { asset: input.asset });

  run(
    `INSERT INTO orders
       (id, account_id, listing_id, plan, duration_days, amount_net, vat_rate_bp, vat_amount,
        amount_total, currency, method, status, provider, provider_ref, crypto_asset,
        crypto_amount, rate_locked_until, invoice_email, invoice_address, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order.id,
      order.account_id,
      order.listing_id,
      order.plan,
      order.duration_days,
      order.amount_net,
      order.vat_rate_bp,
      order.vat_amount,
      order.amount_total,
      order.currency,
      order.method,
      order.provider,
      session.providerRef,
      session.crypto?.asset.toLowerCase() ?? null,
      session.crypto?.amount ?? null,
      session.crypto?.expiresAt ?? null,
      order.invoice_email,
      order.invoice_address,
      order.created_at,
    ],
  );

  /* Zurückgelesen statt aus dem Objekt oben zusammengesetzt: Was der
     Anbieter beim Eröffnen ergänzt hat — Kryptobetrag, Kursfrist —
     steht sonst in der Datenbank, aber nicht in der Antwort. */
  return {
    order: publicOrder(one<Order>("SELECT * FROM orders WHERE id = ?", [id])!),
    checkout: session,
  };
}

export function getOrder(accountId: string, id: string) {
  const row = one<Order>("SELECT * FROM orders WHERE id = ?", [id]);
  if (!row) throw notFound("Bestellung nicht gefunden.");
  if (row.account_id !== accountId) throw forbidden("Das ist nicht Ihre Bestellung.");
  return publicOrder(row);
}

export function listOrders(accountId: string) {
  return all<Order>("SELECT * FROM orders WHERE account_id = ? ORDER BY created_at DESC", [
    accountId,
  ]).map(publicOrder);
}

/**
 * Nimmt ein Anbieter-Ereignis entgegen.
 *
 * Idempotent über `payment_events.provider_event_id`: Kommt dasselbe
 * Ereignis zweimal — und das tut es, jeder Anbieter wiederholt bei
 * ausbleibender Bestätigung —, passiert beim zweiten Mal nichts.
 */
export function handleEvent(event: ProviderEvent, providerName: string) {
  const existing = one<{ id: string }>(
    "SELECT id FROM payment_events WHERE provider = ? AND provider_event_id = ?",
    [providerName, event.providerEventId],
  );
  if (existing) return { duplicate: true as const };

  const order = one<Order>("SELECT * FROM orders WHERE provider = ? AND provider_ref = ?", [
    providerName,
    event.providerRef,
  ]);

  return tx(() => {
    run(
      `INSERT INTO payment_events
         (id, order_id, provider, provider_event_id, type, payload, received_at, processed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId("pev"),
        order?.id ?? null,
        providerName,
        event.providerEventId,
        event.type,
        JSON.stringify(event),
        nowIso(),
        nowIso(),
      ],
    );

    if (!order) return { duplicate: false as const, matched: false as const };

    if (event.type === "payment.succeeded") {
      if (order.status === "paid") return { duplicate: false as const, matched: true as const };
      run("UPDATE orders SET status = 'paid', paid_at = ? WHERE id = ?", [nowIso(), order.id]);

      if (order.listing_id) {
        const listing = activate(order.listing_id, order.plan, order.duration_days);
        // Aufbewahrungsfrist der Ausweise hängt am Inserat, nicht am Upload.
        if (listing.expires_at) extendRetention(order.account_id, listing.expires_at);
      }
    } else {
      run("UPDATE orders SET status = ?, failed_reason = ? WHERE id = ?", [
        event.type === "payment.failed" ? "failed" : "expired",
        event.reason ?? null,
        order.id,
      ]);
    }
    return { duplicate: false as const, matched: true as const };
  });
}

/** Bestellungen, die nie bezahlt wurden, nach 24 Stunden schliessen. */
export function expireStaleOrders() {
  return run(
    `UPDATE orders SET status = 'expired', failed_reason = 'Zeitüberschreitung'
      WHERE status = 'pending' AND created_at < ?`,
    [new Date(Date.now() - 24 * 3600_000).toISOString()],
  );
}

function publicOrder(o: Order) {
  return {
    id: o.id,
    listingId: o.listing_id,
    plan: o.plan,
    durationDays: o.duration_days,
    amount: {
      net: o.amount_net,
      vat: o.vat_amount,
      vatRateBp: o.vat_rate_bp,
      total: o.amount_total,
      currency: o.currency,
    },
    method: o.method,
    status: o.status,
    crypto:
      o.crypto_asset && o.crypto_amount
        ? { asset: o.crypto_asset, amount: o.crypto_amount, rateLockedUntil: o.rate_locked_until }
        : null,
    createdAt: o.created_at,
    paidAt: o.paid_at,
    /* Was auf der Abrechnung steht — die Zusage aus dem Marketing
       gehört auch in die Antwort, damit sie nachprüfbar ist. */
    statementDescriptor: "NM DIGITAL GMBH, ZUERICH",
  };
}

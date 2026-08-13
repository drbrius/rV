/* Preise und Steuer. Der teuerste Fehler in jeder Zahlungsanbindung
   ist ein Rappen, der niemandem auffällt, bis die Buchhaltung ihn
   dreitausendmal findet. */

import { describe, expect, it } from "vitest";
import { DURATIONS, PLANS, VAT_RATE_BP, priceOrder } from "../src/domain/catalog.js";

describe("Preisrechnung", () => {
  it("rechnet Steuer auf 5 Rappen genau", () => {
    const p = priceOrder("plus", 30);
    expect(p.net).toBe(14_900);
    // 14900 × 8.1 % = 1206.9 Rappen → auf 5 gerundet: 1205
    expect(p.vat).toBe(1_205);
    expect(p.total).toBe(16_105);
    expect(p.vatRateBp).toBe(VAT_RATE_BP);
  });

  it("liefert für jedes Paket und jede Laufzeit ganze Rappen", () => {
    for (const plan of ["basis", "plus", "premium"] as const) {
      for (const d of DURATIONS) {
        const p = priceOrder(plan, d);
        expect(Number.isInteger(p.net)).toBe(true);
        expect(Number.isInteger(p.vat)).toBe(true);
        expect(p.total).toBe(p.net + p.vat);
        expect(p.vat % 5).toBe(0);
      }
    }
  });

  it("belohnt längere Laufzeiten — sonst wäre die Preisliste eine Falle", () => {
    for (const plan of ["basis", "plus", "premium"] as const) {
      const proTag7 = PLANS[plan].price[7] / 7;
      const proTag30 = PLANS[plan].price[30] / 30;
      const proTag90 = PLANS[plan].price[90] / 90;
      expect(proTag30).toBeLessThan(proTag7);
      expect(proTag90).toBeLessThan(proTag30);
    }
  });

  it("staffelt die Pakete nach oben", () => {
    for (const d of DURATIONS) {
      expect(PLANS.basis.price[d]).toBeLessThan(PLANS.plus.price[d]);
      expect(PLANS.plus.price[d]).toBeLessThan(PLANS.premium.price[d]);
    }
  });
});

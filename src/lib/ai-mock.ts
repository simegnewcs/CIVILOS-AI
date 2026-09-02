export function getMockDesign(buildingType: string, stories: string, style: string, plotSize: string) {
  const area = plotSize.includes("200") ? 200 : plotSize.includes("400") ? 400 : plotSize.includes("600") ? 600 : 800;
  const floorArea = Math.round(area * 0.55);

  return {
    projectSummary: `A ${stories}-storey ${style.toLowerCase()} ${buildingType.toLowerCase()} building on a ${plotSize} plot in Addis Ababa. The design prioritises natural ventilation, north-facing orientation, and efficient circulation. Three distinct layout options are proposed, each optimised for the Ethiopian climate and ESDA building code compliance.`,
    options: [
      {
        id: "A", label: "Option A", styleTag: `${style} Minimalist`,
        description: `Clean-lined ${style.toLowerCase()} design with open plan ground floor, large glazed openings to the north, and a compact vertical circulation core. Maximises cross-ventilation and natural daylight.`,
        keyFeatures: ["Open-plan living + dining", "North-facing living room", "Compact structural grid", "Flat roof with solar potential", "Double-height entrance lobby"],
        rooms: [
          { name: "Living Room", area: Math.round(floorArea * 0.22), floor: 1 },
          { name: "Dining", area: Math.round(floorArea * 0.12), floor: 1 },
          { name: "Kitchen", area: Math.round(floorArea * 0.10), floor: 1 },
          { name: "Bathroom", area: Math.round(floorArea * 0.05), floor: 1 },
          { name: "Corridor", area: Math.round(floorArea * 0.08), floor: 1 },
          { name: "Master Bedroom", area: Math.round(floorArea * 0.18), floor: 2 },
          { name: "Bedroom 2", area: Math.round(floorArea * 0.13), floor: 2 },
          { name: "Bedroom 3", area: Math.round(floorArea * 0.12), floor: 2 },
        ],
        estimatedArea: floorArea,
        structuralNotes: "Regular column grid 4.5m × 4.5m. Flat slab construction with RC frame. Suitable for 2–3 storeys without specialist foundation.",
        costRange: { min: Math.round(floorArea * 155000), max: Math.round(floorArea * 175000), currency: "ETB" },
      },
      {
        id: "B", label: "Option B", styleTag: "Ethiopian Courtyard",
        description: `Traditional Ethiopian courtyard typology adapted for contemporary living. Central courtyard provides natural light and ventilation to all rooms. Shaded terraces on upper floors reduce solar gain.`,
        keyFeatures: ["Central courtyard", "Shaded terraces", "Split-level arrangement", "Traditional material palette", "Covered outdoor living space"],
        rooms: [
          { name: "Courtyard", area: Math.round(floorArea * 0.18), floor: 1 },
          { name: "Living Room", area: Math.round(floorArea * 0.18), floor: 1 },
          { name: "Kitchen", area: Math.round(floorArea * 0.10), floor: 1 },
          { name: "Store", area: Math.round(floorArea * 0.06), floor: 1 },
          { name: "Bathroom", area: Math.round(floorArea * 0.05), floor: 1 },
          { name: "Master Bedroom", area: Math.round(floorArea * 0.16), floor: 2 },
          { name: "Bedroom 2", area: Math.round(floorArea * 0.14), floor: 2 },
          { name: "Corridor", area: Math.round(floorArea * 0.13), floor: 2 },
        ],
        estimatedArea: Math.round(floorArea * 1.05),
        structuralNotes: "Load-bearing masonry walls around courtyard perimeter. Requires careful drainage design for courtyard. Slightly increased foundation depth.",
        costRange: { min: Math.round(floorArea * 142000), max: Math.round(floorArea * 168000), currency: "ETB" },
      },
      {
        id: "C", label: "Option C", styleTag: "Compact Contemporary",
        description: `Highly efficient floor plate maximising usable net area from the plot. Flat roof designed for solar panel installation. Reduced footprint leaves garden space on south side.`,
        keyFeatures: ["Maximised floor-to-plot ratio", "Solar-ready flat roof", "South garden retained", "Efficient staircase core", "Minimal structural complexity"],
        rooms: [
          { name: "Living Room", area: Math.round(floorArea * 0.20), floor: 1 },
          { name: "Kitchen", area: Math.round(floorArea * 0.11), floor: 1 },
          { name: "Dining", area: Math.round(floorArea * 0.10), floor: 1 },
          { name: "Garage", area: Math.round(floorArea * 0.14), floor: 1 },
          { name: "Bathroom", area: Math.round(floorArea * 0.05), floor: 1 },
          { name: "Master Bedroom", area: Math.round(floorArea * 0.20), floor: 2 },
          { name: "Bedroom 2", area: Math.round(floorArea * 0.12), floor: 2 },
          { name: "Corridor", area: Math.round(floorArea * 0.08), floor: 2 },
        ],
        estimatedArea: Math.round(floorArea * 0.95),
        structuralNotes: "Simple rectangular grid minimises formwork cost. Flat roof reduces labour time. Standard RC frame, no specialist works required.",
        costRange: { min: Math.round(floorArea * 136000), max: Math.round(floorArea * 162000), currency: "ETB" },
      },
    ],
    structuralWarnings: [
      "Ensure all spans verified against ESDA ES EN 1992 (Eurocode 2) before construction",
      "Soil bearing capacity investigation required prior to foundation design",
    ],
    aiRecommendation: "Option A is recommended for modern urban clients prioritising natural light and low maintenance. Option B suits clients wanting cultural connection. Option C is best for budget-conscious builds.",
  };
}

export function getMockCost(totalArea: number, buildingType: string) {
  const base = buildingType === "Commercial" ? 180000 : buildingType === "Public" ? 165000 : 155000;
  const mat = Math.round(totalArea * base * 0.6);
  const lab = Math.round(totalArea * base * 0.28);
  const ov = Math.round(totalArea * base * 0.12);
  return {
    boq: [
      { category: "Site Preparation", description: "Excavation and leveling", unit: "m²", qty: totalArea, unitRate: 5800, total: totalArea * 5800 },
      { category: "Foundation", description: "Strip foundation C25", unit: "m³", qty: Math.round(totalArea * 0.24), unitRate: 41600, total: Math.round(totalArea * 0.24 * 41600) },
      { category: "Structural Frame", description: "RC columns and beams", unit: "m³", qty: Math.round(totalArea * 0.42), unitRate: 62400, total: Math.round(totalArea * 0.42 * 62400) },
      { category: "Masonry", description: "Block walls 20cm", unit: "m²", qty: Math.round(totalArea * 1.6), unitRate: 11050, total: Math.round(totalArea * 1.6 * 11050) },
      { category: "Roof", description: "EGA sheet with timber frame", unit: "m²", qty: Math.round(totalArea * 1.05), unitRate: 15600, total: Math.round(totalArea * 1.05 * 15600) },
      { category: "Finishes", description: "Plaster, tiles, painting", unit: "m²", qty: Math.round(totalArea * 3.2), unitRate: 7150, total: Math.round(totalArea * 3.2 * 7150) },
      { category: "Doors & Windows", description: "Aluminium frames + glass", unit: "pcs", qty: Math.round(totalArea / 12), unitRate: 110500, total: Math.round(totalArea / 12 * 110500) },
      { category: "Electrical", description: "Complete electrical installation", unit: "LS", qty: 1, unitRate: Math.round(totalArea * 14300), total: Math.round(totalArea * 14300) },
      { category: "Plumbing", description: "Water supply and drainage", unit: "LS", qty: 1, unitRate: Math.round(totalArea * 11700), total: Math.round(totalArea * 11700) },
    ],
    summary: {
      materialCost: mat,
      labourCost: lab,
      overheadContingency: ov,
      totalMin: mat + lab + ov,
      totalMax: Math.round((mat + lab + ov) * 1.15),
      currency: "ETB",
      pricePerSqm: base,
    },
    notes: "Rates based on Addis Ababa Q2 2025 market. Labour includes Ethiopian standard rates. Prices in ETB — exclude land acquisition.",
    riskFlags: ["Material price volatility in cement and rebar (±15%)", "Soil condition unknown — allow contingency for foundation"],
  };
}

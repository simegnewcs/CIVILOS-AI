import fs from 'fs';

let content = fs.readFileSync('src/app/studio/page.tsx', 'utf8');

// 1. Insert the AiDrawing helper before ArchFloorPlan
const helperCode = `
function AiDrawing({ title, subtitle, prompt, seed }: { title: string; subtitle: string; prompt: string; seed: number }) {
  const imgUrl = \`https://image.pollinations.ai/prompt/\${encodeURIComponent(prompt)}?width=1024&height=768&nologo=true&seed=\${seed}\`;
  return (
    <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#00c6e0" }}>{title}</span>
        <span style={{ fontSize: 10, color: "#4a6480" }}>{subtitle}</span>
      </div>
      <div style={{ position: "relative", width: "100%", height: 500, background: "#000" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </div>
  );
}

`;

content = content.replace('function ArchFloorPlan', helperCode + 'function ArchFloorPlan');

// 2. Replace ArchFloorPlan body
content = content.replace(/function ArchFloorPlan\([\s\S]*?\/\/ ── Front Elevation/m, `function ArchFloorPlan({ rooms, floor, label }: { rooms: Room[]; floor: number; label: string }) {
  if (!rooms.filter(r => r.floor === floor).length) return null;
  return <AiDrawing title={\`FLOOR PLAN — \${label.toUpperCase()}\`} subtitle="AI Generated Blueprint" prompt={\`architectural 2d floor plan blueprint for floor \${floor}, highly detailed architectural drawing, clean white background, cad style\`} seed={rooms.length * floor} />
}

// ── Front Elevation`);

// 3. Replace FrontElevation
content = content.replace(/function FrontElevation\([\s\S]*?\/\/ ── Side Elevation/m, `function FrontElevation({ rooms, stories, styleTag }: { rooms: Room[]; stories: number; styleTag: string }) {
  return <AiDrawing title="FRONT ELEVATION — VIEW A" subtitle="Photorealistic Architectural Drawing" prompt={\`Architectural front elevation technical drawing of a \${stories} story \${styleTag} style house, clean white background, architectural blueprint style, high detail\`} seed={rooms.length + stories} />
}

// ── Side Elevation`);

// 4. Replace SideElevation
content = content.replace(/function SideElevation\([\s\S]*?\/\/ ── Back Elevation/m, `function SideElevation({ rooms, stories, styleTag, side }: { rooms: Room[]; stories: number; styleTag: string; side: "LEFT" | "RIGHT" }) {
  return <AiDrawing title={\`SIDE ELEVATION — \${side}\`} subtitle="Photorealistic Architectural Drawing" prompt={\`Architectural side elevation technical drawing of a \${stories} story \${styleTag} style house, clean white background, architectural blueprint style, high detail\`} seed={rooms.length * (side === 'LEFT' ? 1 : 2)} />
}

// ── Back Elevation`);

// 5. Replace BackElevation
content = content.replace(/function BackElevation\([\s\S]*?\/\/ ── 3D Iso/m, `function BackElevation({ rooms, stories, styleTag }: { rooms: Room[]; stories: number; styleTag: string }) {
  return <AiDrawing title="BACK ELEVATION — VIEW C" subtitle="Photorealistic Architectural Drawing" prompt={\`Architectural back rear elevation technical drawing of a \${stories} story \${styleTag} style house, clean white background, architectural blueprint style, high detail\`} seed={rooms.length + 5} />
}

// ── 3D Iso`);

// 6. Replace Iso3DView
content = content.replace(/function Iso3DView\([\s\S]*?\/\/ ── Real Construction/m, `function Iso3DView({ rooms, stories, styleTag }: { rooms: Room[]; stories: number; styleTag: string }) {
  return <AiDrawing title={\`\${styleTag?.toUpperCase() || "RESIDENTIAL"} DESIGN\`} subtitle={\`\${stories} FLOOR\${stories > 1 ? "S" : ""} · ISOMETRIC 3D VIEW\`} prompt={\`3D isometric architectural render of a \${stories} story \${styleTag} style house, white background, high quality architectural visualization, beautiful lighting\`} seed={rooms.length + 10} />
}

// ── Real Construction`);

// 7. Replace SectionCut
content = content.replace(/function SectionCut\([\s\S]*?\}  \/\//m, `function SectionCut({ rooms, stories }: { rooms: Room[]; stories: number }) {
  return <AiDrawing title="SECTION CUT — A-A" subtitle="Longitudinal section · AI Generated" prompt={\`Architectural section cut drawing of a \${stories} story house, showing internal rooms, highly detailed cad style drawing, white background\`} seed={rooms.length + 15} />
}

//`);

fs.writeFileSync('src/app/studio/page.tsx', content);
console.log('Replacements complete');

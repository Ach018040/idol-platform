import { NextRequest, NextResponse } from "next/server";
import { createExportJob } from "@/lib/design/storage";

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(entries: { filename: string; content: string }[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.filename, "utf8");
    const content = Buffer.from(entry.content, "utf8");
    const checksum = crc32(content);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(content.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, content);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(content.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + content.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const format = String(body?.format || "html").toLowerCase();
  const html = String(body?.html || "");
  const markdown = String(body?.markdown || "");
  const title = String(body?.title || "idol-design-artifact");
  const projectId = typeof body?.projectId === "string" ? body.projectId : "";
  const artifactId = typeof body?.artifactId === "string" ? body.artifactId : null;

  if (!["html", "markdown", "zip", "pdf", "pptx"].includes(format)) {
    return NextResponse.json({ error: "unsupported export format" }, { status: 400 });
  }

  if (projectId && ["html", "markdown", "zip", "pdf", "pptx"].includes(format)) {
    await createExportJob(projectId, artifactId, format as "html" | "markdown" | "zip" | "pdf" | "pptx");
  }

  if (format === "html") {
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${title}.html"`,
      },
    });
  }

  if (format === "markdown") {
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${title}.md"`,
      },
    });
  }

  if (format === "zip") {
    return new NextResponse(
      zipStore([
        { filename: "index.html", content: html },
        { filename: "brief.md", content: markdown },
      ]),
      {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${title}.zip"`,
        },
      },
    );
  }

  return NextResponse.json({
    status: "queued",
    format,
    message: "PDF/PPTX exporter job 已建立。正式 renderer 會在下一階段接 Playwright / PPTXGenJS worker。",
  });
}

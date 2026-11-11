import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ICONS } from "../components/ServiceCard";
import { CATEGORY_MAP } from "../data/servicesData";
import { useServices } from "../lib/useServices";
import { fetchApi } from "../lib/api";

const MAX_SIZE = 25 * 1024 * 1024;
const TEXT_SLUGS = ["json-formatter", "word-counter", "hash-generator", "ai-summarizer", "grammar-checker"];

const REAL_SLUGS = [
  "json-formatter",
  "word-counter",
  "hash-generator",
  "image-converter",
  "image-compressor",
  "merge-pdf",
  "split-pdf",
  "csv-to-json",
];
const IMAGE_MIME = { webp: "image/webp", jpg: "image/jpeg", png: "image/png" };
const COMPRESS_QUALITY = { light: 0.9, balanced: 0.75, high: 0.5 };
const ACCEPT_CHECK = {
  pdf: (f) => /\.pdf$/i.test(f.name),
  img: (f) => f.type.startsWith("image/"),
  vid: (f) => f.type.startsWith("video/"),
};
const PREVIEW_LIMIT = 20000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function formatBytes(bytes = 0) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
}


async function convertImage(file, format, quality) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (format === "jpg") {
    ctx.fillStyle = "#ffffff"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, IMAGE_MIME[format], quality));
  if (!blob) throw new Error("Trình duyệt không hỗ trợ định dạng này.");
  return blob;
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getPdfDocument() {
  const { PDFDocument } = await import("pdf-lib");
  return PDFDocument;
}

async function loadPdf(PDFDocument, file) {
  try {
    return await PDFDocument.load(await file.arrayBuffer());
  } catch {
    throw new Error(`Không đọc được "${file.name}" (tệp hỏng hoặc đặt mật khẩu).`);
  }
}

async function mergePdfs(files) {
  const PDFDocument = await getPdfDocument();
  const merged = await PDFDocument.create();
  for (const file of files) {
    const src = await loadPdf(PDFDocument, file);
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const bytes = await merged.save();
  return {
    blob: new Blob([bytes], { type: "application/pdf" }),
    pages: merged.getPageCount(),
  };
}

function parsePageRange(text, total) {
  const indexes = [];
  for (const part of text.split(",")) {
    const p = part.trim();
    if (!p) continue;
    const m = p.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw new Error(`Khoảng trang không hợp lệ: "${p}". Ví dụ đúng: 1-3, 5, 8`);
    const from = Number(m[1]);
    const to = m[2] ? Number(m[2]) : from;
    if (from < 1 || to < from || to > total) {
      throw new Error(`Trang "${p}" nằm ngoài phạm vi (tệp có ${total} trang).`);
    }
    for (let i = from; i <= to; i++) {
      if (!indexes.includes(i - 1)) indexes.push(i - 1);
    }
  }
  if (!indexes.length) throw new Error("Hãy nhập trang cần tách, ví dụ: 1-3, 5");
  return indexes;
}

async function splitPdf(file, rangeText) {
  const PDFDocument = await getPdfDocument();
  const src = await loadPdf(PDFDocument, file);
  const total = src.getPageCount();
  const indexes = parsePageRange(rangeText, total);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indexes);
  pages.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  return {
    blob: new Blob([bytes], { type: "application/pdf" }),
    pages: indexes.length,
    total,
  };
}

function parseCsv(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const delimiter = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";

  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export default function Tool() {
  const { id } = useParams();
  const services = useServices();

  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [outputFormat, setOutputFormat] = useState("webp");
  const [compressLevel, setCompressLevel] = useState("balanced");
  const [pageRange, setPageRange] = useState("1");
  const [outputName, setOutputName] = useState("toolnest-ket-qua");

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setFiles([]);
    setTextInput("");
    setError("");
    setResult(null);
    setProgress(0);
    setProcessing(false);
    setCopied(false);
  }, [id]);

  if (services === null) {
    return (
      <section className="page">
        <div className="container">
          <div className="empty-box">Đang tải...</div>
        </div>
      </section>
    );
  }

  const service = services.find((s) => s.id === Number(id));

  if (!service) {
    return (
      <section className="page">
        <div className="container">
          <h1 className="page-header__title">Không tìm thấy dịch vụ</h1>
          <Link className="btn" to="/services">Về danh sách dịch vụ</Link>
        </div>
      </section>
    );
  }

  const category = CATEGORY_MAP[service.category] || CATEGORY_MAP.pdf;
  const slug = service.slug || "";
  const ready = service.status === "ready";
  const credit = service.credit ?? 0;

  const isTextTool = service.category === "ai" || TEXT_SLUGS.includes(slug);
  const isMerge = slug === "merge-pdf";
  const isSplit = slug === "split-pdf";
  const isCsv = slug === "csv-to-json";
  const isImageConvert = slug === "image-converter";
  const isImageCompress = slug === "image-compressor";
  const baseName = outputName.trim() || "toolnest-ket-qua";

  const textPlaceholder =
    slug === "json-formatter"
      ? '{"ten": "ToolNest", "phienBan": 1}'
      : slug === "hash-generator"
      ? "Nhập chuỗi cần tạo mã băm..."
      : slug === "ai-summarizer"
      ? "Dán bài viết dài cần tóm tắt..."
      : "Nhập hoặc dán văn bản cần xử lý...";

  function handleAddFiles(fileList) {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    setResult(null);

    const check = ACCEPT_CHECK[service.category];
    if (check && !incoming.every(check)) {
      setError(`Chỉ nhận ${category.verb}.`);
      return;
    }
    if (isCsv && !incoming.every((f) => /\.csv$/i.test(f.name))) {
      setError("Chỉ nhận tệp .csv.");
      return;
    }
    if (incoming.some((f) => f.size > MAX_SIZE)) {
      setError("Mỗi tệp tối đa 25MB.");
      return;
    }
    setError("");
    setFiles(isMerge ? (prev) => [...prev, ...incoming] : [incoming[0]]);
  }

  function handleRemoveFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  }

  function handleReset() {
    setFiles([]);
    setTextInput("");
    setError("");
    setResult(null);
    setProgress(0);
    setCopied(false);
  }

  async function runTool() {
    if (slug === "json-formatter") {
      let parsed;
      try {
        parsed = JSON.parse(textInput);
      } catch (e) {
        throw new Error(`Lỗi cú pháp JSON: ${e.message}`);
      }
      return {
        type: "text",
        summary: "JSON hợp lệ, đã căn lề 2 khoảng trắng",
        content: JSON.stringify(parsed, null, 2),
        ext: "json",
      };
    }

    if (slug === "word-counter") {
      const clean = textInput.trim();
      const words = clean ? clean.split(/\s+/).length : 0;
      const sentences = clean ? clean.split(/[.!?]+/).filter((s) => s.trim()).length : 0;
      const noSpace = textInput.replace(/\s/g, "").length;
      return {
        type: "text",
        summary: "Thống kê văn bản",
        content: `Số từ: ${words}\nSố ký tự (có khoảng trắng): ${textInput.length}\nSố ký tự (không khoảng trắng): ${noSpace}\nSố câu: ${sentences}`,
        ext: "txt",
      };
    }

    if (slug === "hash-generator") {
      return {
        type: "text",
        summary: "Mã băm SHA-256 của văn bản",
        content: await sha256(textInput),
        ext: "txt",
      };
    }

    if (isTextTool) {
      const sentences = textInput.trim().split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
      return { type: "text", summary: "Bản tóm tắt minh hoạ", content: sentences, ext: "txt" };
    }

    if (isMerge) {
      const { blob, pages } = await mergePdfs(files);
      return {
        type: "file",
        blob,
        fileName: `${baseName}.pdf`,
        summary: `Đã ghép ${files.length} tệp, tổng ${pages} trang • ${formatBytes(blob.size)}`,
      };
    }

    if (isSplit) {
      const { blob, pages, total } = await splitPdf(files[0], pageRange);
      return {
        type: "file",
        blob,
        fileName: `${baseName}.pdf`,
        summary: `Đã tách ${pages}/${total} trang • ${formatBytes(blob.size)}`,
      };
    }

    if (isCsv) {
      const text = (await files[0].text()).replace(/^\uFEFF/, "");
      const rows = parseCsv(text);
      if (rows.length < 2) {
        throw new Error("Tệp CSV cần có dòng tiêu đề và ít nhất một dòng dữ liệu.");
      }
      const [headers, ...body] = rows;
      const data = body.map((r) =>
        Object.fromEntries(headers.map((h, i) => [h.trim() || `cot_${i + 1}`, r[i] ?? ""]))
      );
      return {
        type: "text",
        summary: `${data.length} dòng, ${headers.length} cột`,
        content: JSON.stringify(data, null, 2),
        ext: "json",
      };
    }

    if (isImageConvert || isImageCompress) {
      const file = files[0];
      const format = isImageConvert ? outputFormat : file.type === "image/jpeg" ? "jpg" : "webp";
      const quality = isImageCompress ? COMPRESS_QUALITY[compressLevel] : 0.92;
      const blob = await convertImage(file, format, quality);
      return {
        type: "file",
        blob,
        fileName: `${baseName}.${format}`,
        summary: `Từ ${formatBytes(file.size)} thành ${formatBytes(blob.size)}`,
      };
    }

    const first = files[0];
    return {
      type: "file",
      blob: first,
      fileName: first.name,
      summary: `Minh hoạ: trả lại tệp gốc (${formatBytes(first.size)})`,
    };
  }

  async function handleProcess() {
    setError("");
    setResult(null);
    setCopied(false);

    if (isTextTool) {
      if (!textInput.trim()) return setError("Vui lòng nhập nội dung cần xử lý.");
    } else {
      if (files.length === 0) return setError(`Vui lòng chọn ít nhất một ${category.verb}.`);
      if (isMerge && files.length < 2) return setError("Gộp PDF cần ít nhất 2 tệp.");
    }

    setProcessing(true);
    setProgress(10);
    const timer = setInterval(() => setProgress((p) => (p < 85 ? p + 15 : p)), 200);
    const startedAt = Date.now();

    try {
      const [out] = await Promise.all([runTool(), sleep(700)]);
      setResult(out);

      const inputSummary = isTextTool
        ? textInput.trim().slice(0, 100)
        : files.map((f) => f.name).join(", ");
      fetchApi(`/services/${service.id}/use`, {
        method: "POST",
        body: JSON.stringify({ inputSummary, durationMs: Date.now() - startedAt }),
      }).catch(() => {});
    } catch (err) {
      setError(err.message || "Xử lý thất bại, vui lòng thử lại.");
    } finally {
      clearInterval(timer);
      setProgress(100);
      setProcessing(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    const isText = result.type === "text";
    const blob = isText
      ? new Blob([result.content], { type: "text/plain;charset=utf-8" })
      : result.blob;
    const name = isText ? `${baseName}.${result.ext}` : result.fileName;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    if (!result?.content) return;
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Không sao chép được, hãy bôi đen và copy thủ công.");
    }
  }

  return (
    <section className="page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/services">Dịch vụ</Link>
          <span>/</span>
          <Link to={`/services/${service.id}`}>{service.name}</Link>
          <span>/</span>
          <span>Sử dụng</span>
        </nav>

        <div className="tool-header">
          <div className={`tool-header__info color-${service.category}`}>
            <span className="tool-icon tool-icon--lg">
              <svg className="icon" viewBox="0 0 24 24">{ICONS[service.category]}</svg>
            </span>
            <div>
              <div className="tool-header__title-row">
                <h1 className="tool-header__title">{service.name}</h1>
                <span className={`status-tag ${ready ? "success" : "coming-soon"}`}>
                  {ready ? "Sẵn sàng" : "Bản xem trước"}
                </span>
              </div>
              <p className="tool-header__sub">{service.desc}</p>
            </div>
          </div>

          <Link className="btn ghost" to={`/services/${service.id}`}>
            &larr; Chi tiết dịch vụ
          </Link>
        </div>

        <div className="workspace-grid">
          <div className="detail-panel workspace-main">
            <h2 className="workspace-section-title">
              {isTextTool ? "1. Nhập nội dung đầu vào" : `1. Tải ${category.verb} lên`}
            </h2>

            {isTextTool ? (
              <div className="ai-box">
                <textarea
                  className="ai-box__input"
                  rows={7}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={textPlaceholder}
                />
                <div className="ai-box__meta">
                  <span>{textInput.length} ký tự</span>
                  <span>Hỗ trợ Tiếng Việt và Tiếng Anh</span>
                </div>
              </div>
            ) : (
              <>
                <label
                  className={`dropzone ${isDragOver ? "is-dragover" : ""}`}
                  htmlFor="tool-file-input"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handleAddFiles(e.dataTransfer.files);
                  }}
                >
                  <input
                    id="tool-file-input"
                    type="file"
                    className="dropzone__input"
                    accept={isCsv ? ".csv,text/csv" : category.accept}
                    multiple={isMerge}
                    onChange={(e) => {
                      handleAddFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <span className="dropzone__icon">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M12 16V4m0 0-4 4m4-4 4 4" />
                      <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
                    </svg>
                  </span>
                  <b className="dropzone__title">
                    Kéo thả {category.verb} vào đây hoặc bấm để chọn tệp
                  </b>
                  <span className="dropzone__hint">
                    {isMerge
                      ? "Chọn nhiều tệp PDF, thứ tự ghép theo thứ tự chọn • Tối đa 25MB mỗi tệp"
                      : "Tối đa 25MB mỗi tệp"}
                  </span>
                </label>

                {files.length > 0 && (
                  <div className="file-list">
                    {files.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="file-item">
                        <div className="file-item__info">
                          <span className="file-item__badge">{isMerge ? idx + 1 : category.short}</span>
                          <div>
                            <b className="file-item__name">{file.name}</b>
                            <small className="file-item__size">
                              {formatBytes(file.size)} • Sẵn sàng xử lý
                            </small>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn ghost file-item__remove"
                          onClick={() => handleRemoveFile(idx)}
                        >
                          Xoá
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {error && <p className="form-error tool-error">{error}</p>}

            <div className="result-box">
              <div className="result-box__head">
                <b className="result-box__title">Kết quả xử lý</b>
                <span
                  className={`status-tag ${
                    result ? "success" : processing ? "coming-soon" : "neutral"
                  }`}
                >
                  {result ? "Hoàn tất" : processing ? `Đang xử lý ${progress}%` : "Chưa chạy"}
                </span>
              </div>

              {processing && (
                <div className="progress-bar">
                  <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
                </div>
              )}

              {!processing && !result && (
                <p className="result-box__empty">
                  Chọn tuỳ chọn ở cột bên phải và bấm <b>"Bắt đầu xử lý"</b> để nhận kết quả tại đây.
                </p>
              )}

              {result && (
                <div className="result-card">
                  <div className="result-card__info">
                    <b className="result-card__name">
                      {result.type === "file" ? result.fileName : "Nội dung đầu ra"}
                    </b>
                    <span className="result-card__meta">{result.summary}</span>
                  </div>

                  {result.type === "text" && (
                    <pre className="result-card__preview">
                      {result.content.length > PREVIEW_LIMIT
                        ? `${result.content.slice(0, PREVIEW_LIMIT)}\n... (xem đầy đủ trong tệp tải về)`
                        : result.content}
                    </pre>
                  )}

                  <div className="result-card__actions">
                    <button type="button" className="btn" onClick={handleDownload}>
                      Tải kết quả về
                    </button>
                    {result.type === "text" && (
                      <button type="button" className="btn ghost" onClick={handleCopy}>
                        {copied ? "Đã sao chép!" : "Sao chép văn bản"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="detail-panel workspace-aside">
            <h2 className="workspace-section-title">2. Tuỳ chọn xử lý</h2>

            <div className="tool-options">
              {isImageConvert && (
                <div className="tool-field">
                  <label className="tool-field__label" htmlFor="opt-format">Định dạng đầu ra</label>
                  <select
                    id="opt-format"
                    className="tool-field__control"
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                  >
                    <option value="webp">WebP (nhẹ, tối ưu web)</option>
                    <option value="jpg">JPG (phổ biến)</option>
                    <option value="png">PNG (giữ nền trong suốt)</option>
                  </select>
                </div>
              )}

              {isImageCompress && (
                <div className="tool-field">
                  <label className="tool-field__label" htmlFor="opt-level">Mức độ nén</label>
                  <select
                    id="opt-level"
                    className="tool-field__control"
                    value={compressLevel}
                    onChange={(e) => setCompressLevel(e.target.value)}
                  >
                    <option value="balanced">Cân bằng (khuyên dùng)</option>
                    <option value="high">Nén mạnh (dung lượng nhỏ nhất)</option>
                    <option value="light">Nén nhẹ (ưu tiên độ nét)</option>
                  </select>
                </div>
              )}

              {isSplit && (
                <div className="tool-field">
                  <label className="tool-field__label" htmlFor="opt-pages">Trang cần tách</label>
                  <input
                    id="opt-pages"
                    type="text"
                    className="tool-field__control"
                    placeholder="Ví dụ: 1-3, 5, 8"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                  />
                </div>
              )}

              <div className="tool-field">
                <label className="tool-field__label" htmlFor="opt-name">Tên tệp kết quả</label>
                <input
                  id="opt-name"
                  type="text"
                  className="tool-field__control"
                  placeholder="Tuỳ chọn tên tệp đầu ra..."
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                />
              </div>
            </div>

            <div className="tool-summary">
              <div className="tool-summary__row">
                <span>Chi phí lượt dùng</span>
                <b>{credit > 0 ? `${credit} Credit` : "Miễn phí"}</b>
              </div>
              <div className="tool-summary__row">
                <span>Thời gian xử lý</span>
                <b>~1 giây</b>
              </div>
            </div>

            <button
              type="button"
              className="btn workspace-aside__submit"
              disabled={processing || !ready}
              onClick={handleProcess}
            >
              {!ready ? "Sắp ra mắt" : processing ? "Đang xử lý..." : "Bắt đầu xử lý"}
            </button>
            <button
              type="button"
              className="btn ghost workspace-aside__reset"
              disabled={processing}
              onClick={handleReset}
            >
              Làm mới
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}
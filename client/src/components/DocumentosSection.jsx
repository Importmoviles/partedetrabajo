import { useEffect, useRef, useState } from "react";
import { FileText, Camera, Upload, X } from "lucide-react";
import { api } from "../lib/api";
import { SectionLabel, Select } from "./ui";
import { CATEGORIAS_DOC } from "../lib/statusMap";

const categoriaLabel = {
  contrato: "Contrato",
  foto: "Foto",
  certificado: "Certificado",
  garantia: "Garantía",
  otro: "Otro",
};

export default function DocumentosSection({ clienteId, trabajoId }) {
  const [documentos, setDocumentos] = useState([]);
  const [categoria, setCategoria] = useState("foto");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const cameraRef = useRef(null);
  const fileRef = useRef(null);

  function load() {
    const query = clienteId ? `cliente_id=${clienteId}` : `trabajo_id=${trabajoId}`;
    api.get(`/documentos?${query}`).then(setDocumentos);
  }

  useEffect(load, [clienteId, trabajoId]);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const form = new FormData();
    form.append("archivo", file);
    form.append("categoria", categoria);
    if (clienteId) form.append("cliente_id", clienteId);
    if (trabajoId) form.append("trabajo_id", trabajoId);
    try {
      await api.post("/documentos", form);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Borrar este documento?")) return;
    await api.del(`/documentos/${id}`);
    load();
  }

  return (
    <>
      <SectionLabel>Fotos y documentos</SectionLabel>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-muted shrink-0">Categoría:</span>
        <Select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="max-w-[160px]">
          {CATEGORIAS_DOC.map((c) => (
            <option key={c} value={c}>
              {categoriaLabel[c]}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink"
        >
          <Camera size={15} /> {uploading ? "Subiendo..." : "Tomar foto"}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink"
        >
          <Upload size={15} /> {uploading ? "Subiendo..." : "Subir archivo"}
        </button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
      </div>
      {error && <p className="text-danger text-sm mb-2">{error}</p>}

      {documentos.length === 0 && <p className="text-sm text-muted mb-2">Sin documentos todavía.</p>}
      {documentos.map((d) => (
        <div key={d.id} className="flex items-center justify-between bg-surface border border-line rounded-xl px-3 py-2 mb-2">
          <a
            href={`/api/documentos/${d.id}/archivo`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-ink truncate"
          >
            <FileText size={15} className="text-muted shrink-0" />
            <span className="truncate">{d.nombre_original}</span>
            <span className="text-[10px] text-muted shrink-0">{categoriaLabel[d.categoria]}</span>
          </a>
          <button onClick={() => handleDelete(d.id)} className="text-muted shrink-0 ml-2">
            <X size={14} />
          </button>
        </div>
      ))}
    </>
  );
}

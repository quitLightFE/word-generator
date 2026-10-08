import { useMemo, useState } from "react";
import { convertHtmlToDocx } from "dom-docx/browser";

import { template } from "./data/template";

// Изменили начальные значения дат на стандартный формат YYYY-MM-DD
const initialData = {
  parents: "",
  fio: "",
  hourcount: "",
  dolgi: "",
  rangeStart: "",
  rangeEnd: "",
  subjects: "",
};

// Функция форматирования даты из "2026-09-02" в "2 сентября 2026"
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  // Проверка на валидность даты
  if (isNaN(date.getTime())) return dateString;

  return date
    .toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .replace(/\s*г\.?$/, ""); // Удаляем "г.", если браузер его добавляет
};

function fillTemplate(source: string, data: Record<string, string>) {
  return source.replace(/{{\s*([\w]+)\s*}}/g, (_, key) => {
    const value = data[key] || "_______";
    // Если это ключи дат, автоматически форматируем их для красивого вывода в HTML/Word
    if (key === "rangeStart" || key === "rangeEnd") {
      return formatDate(value);
    }
    return value;
  });
}

export default function App() {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const filledHtml = useMemo(() => fillTemplate(template, data), [data]);

  const setField = (key: keyof typeof data, value: string) => {
    setData((current) => ({ ...current, [key]: value }));
  };

  const downloadDocx = async () => {
    try {
      setLoading(true);

      const blob = await convertHtmlToDocx(filledHtml, {
        orientation: "portrait",
        margins: {
          top: 720,
          right: 720,
          bottom: 720,
          left: 720,
        },
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "document.docx";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Не удалось создать DOCX");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app">
      <section className="panel">
        <h1>Word Generator</h1>
        <p className="muted">HTML → DOCX</p>

        <label>
          Родители
          <input
            value={data.parents}
            onChange={(e) => setField("parents", e.target.value)}
          />
        </label>

        <label>
          ФИО
          <input
            value={data.fio}
            onChange={(e) => setField("fio", e.target.value)}
          />
        </label>

        <label>
          Часы пропусков
          <input
            value={data.hourcount}
            onChange={(e) => setField("hourcount", e.target.value)}
          />
        </label>

        <label>
          Задолженность
          <input
            value={data.dolgi}
            onChange={(e) => setField("dolgi", e.target.value)}
          />
        </label>

        {/* Теперь value принимает чистую строку формата YYYY-MM-DD напрямую из стейта */}
        <label>
          Начало периода
          <input
            type="date"
            value={data.rangeStart}
            onChange={(e) => setField("rangeStart", e.target.value)}
          />
        </label>
        <label>
          Конец периода
          <input
            type="date"
            value={data.rangeEnd}
            onChange={(e) => setField("rangeEnd", e.target.value)}
          />
        </label>

        <label>
          по Дисциплинам:
          <input
            value={data.subjects}
            onChange={(e) => setField("subjects", e.target.value)}
          />
        </label>

        <button onClick={downloadDocx} disabled={loading}>
          {loading ? "Создаём..." : "Скачать DOCX"}
        </button>
      </section>

      <section className="preview">
        <div
          className="document"
          dangerouslySetInnerHTML={{ __html: filledHtml }}
        />
      </section>
    </main>
  );
}

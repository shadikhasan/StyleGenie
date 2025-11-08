// TeamSection.tsx
import { Github, Linkedin, Mail, Globe, GraduationCap } from "lucide-react"; // ✅ all icons
import React, { useMemo, useState } from "react";

type Member = {
  id: string;
  name: string;
  role: string;
  team?: string;
  email?: string;
  slack?: string;
  timezone?: string;
  avatarUrl?: string;
  skills?: string[];
  responsibilities?: string[];
  university?: string;
  subject?: string;
  links?: {
    site?: string;
    github?: string;
    linkedin?: string;
  };
};

type Props = {
  title?: string;
  description?: string;
  members: Member[];
};

export default function TeamSection({
  title = "Team: Neural_Architects",
  description = "Meet the core members behind the project.",
  members,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return members.filter((m) =>
      [
        m.name,
        m.role,
        m.team,
        m.university,
        m.subject,
        ...(m.skills ?? []),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [members, query]);

  return (
    <div
      style={{
        padding: "2rem",
        borderRadius: "16px",
        background: "#fafafa",
        border: "1px solid #eee",
        maxWidth: "1600px",
        margin: "2rem auto",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      }}
    >
      <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        {title}
      </h2>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>{description}</p>

      <input
        type="text"
        placeholder="Search by name, role, team, university or subject..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginBottom: "2rem",
        }}
      />

      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "#999" }}>No team members found.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {filtered.map((m) => (
            <div
              key={m.id}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: "12px",
                padding: "1.25rem",
                background: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                gap: "0.9rem",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    color: "#444",
                    flexShrink: 0,
                  }}
                >
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt={m.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "12px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    m.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{m.name}</div>
                  <div style={{ color: "#666", fontSize: "0.9rem" }}>{m.role}</div>
                  {m.team && (
                    <div
                      style={{
                        display: "inline-block",
                        background: "#eef3ff",
                        color: "#2f54eb",
                        fontSize: "0.75rem",
                        padding: "2px 6px",
                        borderRadius: "6px",
                        marginTop: "4px",
                      }}
                    >
                      {m.team}
                    </div>
                  )}
                </div>
              </div>

              {/* Education */}
              {(m.university || m.subject) && (
                <div
                  style={{
                    background: "#fafafa",
                    border: "1px solid #f0f0f0",
                    borderRadius: "8px",
                    padding: "8px 10px",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "#333", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                    <GraduationCap className="w-4 h-4 text-purple-600" /> Education
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#555", marginTop: "4px" }}>
                    {m.university && <span>{m.university}</span>}
                    {m.university && m.subject && <span> · </span>}
                    {m.subject && <span>{m.subject}</span>}
                  </div>
                </div>
              )}

              {/* Contact & Links */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {m.email && (
                  <a
                    href={`mailto:${m.email}`}
                    style={linkStyle}
                    className="flex items-center gap-1"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Mail className="w-4 h-4 text-red-500" /> Email
                  </a>
                )}
                {m.links?.linkedin && (
                  <a
                    href={m.links.linkedin}
                    style={linkStyle}
                    className="flex items-center gap-1"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Linkedin className="w-4 h-4 text-[#0A66C2]" /> LinkedIn
                  </a>
                )}
                {m.links?.github && (
                  <a
                    href={m.links.github}
                    style={linkStyle}
                    className="flex items-center gap-1"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Github className="w-4 h-4 text-black" /> GitHub
                  </a>
                )}
                {m.links?.site && (
                  <a
                    href={m.links.site}
                    style={linkStyle}
                    className="flex items-center gap-1"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe className="w-4 h-4 text-green-600" /> Website
                  </a>
                )}
              </div>

              {m.timezone && (
                <p style={{ fontSize: "0.75rem", color: "#999" }}>🕓 {m.timezone}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#2f54eb",
  background: "#f0f5ff",
  padding: "4px 8px",
  borderRadius: "6px",
  textDecoration: "none",
};

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface ChaveAtivadaEmailProps {
  nomeLoja:      string
  nomeCampanha:  string
  beneficioLabel: string
  destaque:       string
  codigo:         string
  expiraEm:       string   // já formatado: "31/12/2026"
  regrasUso?:     string | null
  corPrimaria:    string
}

export function ChaveAtivadaEmail({
  nomeLoja,
  nomeCampanha,
  beneficioLabel,
  destaque,
  codigo,
  expiraEm,
  regrasUso,
  corPrimaria,
}: ChaveAtivadaEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>
        ✅ Sua chave foi ativada! Apresente o código {codigo} em {nomeLoja}.
      </Preview>
      <Body style={{ backgroundColor: "#f0f0f0", fontFamily: "'Segoe UI', Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 520, margin: "36px auto", backgroundColor: "#ffffff", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}>

          {/* Header stripe */}
          <Section style={{ background: corPrimaria, padding: "36px 32px 28px", textAlign: "center" }}>
            <Heading style={{ color: "#ffffff", fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.3px" }}>
              {nomeLoja}
            </Heading>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: "6px 0 0" }}>
              Cortesia exclusiva — ativada com sucesso ✅
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: "32px 32px 0" }}>

            {/* Benefit headline */}
            <Section style={{ backgroundColor: `${corPrimaria}0f`, border: `2px solid ${corPrimaria}30`, borderRadius: 12, padding: "24px 20px", textAlign: "center", marginBottom: 24 }}>
              <Text style={{ color: corPrimaria, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>
                {beneficioLabel} · {nomeCampanha}
              </Text>
              {destaque ? (
                <Text style={{ color: "#111827", fontSize: 40, fontWeight: 900, letterSpacing: "-1px", margin: "0 0 4px", lineHeight: "1" }}>
                  {destaque}
                </Text>
              ) : null}
            </Section>

            {/* Code block */}
            <Section style={{ backgroundColor: "#0f0f0f", borderRadius: 12, padding: "24px 20px", textAlign: "center", marginBottom: 24 }}>
              <Text style={{ color: "rgba(255,255,255,0.40)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px" }}>
                Seu código de ativação
              </Text>
              <Text style={{ color: corPrimaria, fontFamily: "monospace", fontSize: 28, fontWeight: 900, letterSpacing: "6px", margin: 0 }}>
                {codigo}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "12px 0 0" }}>
                Válido até {expiraEm}
              </Text>
            </Section>

            {/* Instruction */}
            <Section style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px", marginBottom: 24 }}>
              <Text style={{ color: "#374151", fontSize: 14, lineHeight: "22px", margin: 0 }}>
                📲 <strong>Como resgatar:</strong> apresente este e-mail ou o código acima ao atendente de <strong>{nomeLoja}</strong> para receber seu benefício.
              </Text>
            </Section>

            {/* Rules */}
            {regrasUso ? (
              <Section style={{ marginBottom: 24 }}>
                <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
                  Regras de uso
                </Text>
                <Text style={{ color: "#6b7280", fontSize: 13, lineHeight: "20px", margin: 0, whiteSpace: "pre-line" }}>
                  {regrasUso}
                </Text>
              </Section>
            ) : null}

          </Section>

          {/* Footer */}
          <Section style={{ padding: "20px 32px 28px", textAlign: "center", borderTop: "1px solid #f1f5f9", marginTop: 8 }}>
            <Text style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>
              Powered by{" "}
              <span style={{ color: "#6b7280", fontWeight: 600 }}>Courtesy</span>
              <span style={{ color: "#10b981", fontWeight: 600 }}>fy</span>
            </Text>
            <Text style={{ color: "#d1d5db", fontSize: 11, margin: "4px 0 0" }}>
              Você recebeu este e-mail porque ativou uma chave de cortesia.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

export default ChaveAtivadaEmail

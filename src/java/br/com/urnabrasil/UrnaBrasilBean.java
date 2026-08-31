package br.com.urnabrasil;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import javax.annotation.PostConstruct;
import javax.faces.bean.ApplicationScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.context.FacesContext;

/**
 * Managed Bean principal da Urna Brasil.
 * Carrega o arquivo candidatos.json e disponibiliza para o JavaScript.
 */
@ManagedBean(name = "urnaBean")
@ApplicationScoped
public class UrnaBrasilBean implements Serializable {

    private static final long serialVersionUID = 1L;

    private String candidatosJson;
    private String versaoUrna = "UE2022 - TSE";
    private String anoEleicao = "2026";

    @PostConstruct
    public void init() {
        carregarCandidatos();
    }

    /**
     * Carrega o arquivo candidatos.json do diretório raiz da aplicação.
     * Caso o arquivo não exista, retorna um JSON vazio.
     */
    private void carregarCandidatos() {
        try {
            FacesContext ctx = FacesContext.getCurrentInstance();
            if (ctx != null) {
                String realPath = ctx.getExternalContext().getRealPath("/candidatos.json");
                if (realPath != null) {
                    Path jsonPath = Paths.get(realPath);
                    if (Files.exists(jsonPath)) {
                        candidatosJson = new String(Files.readAllBytes(jsonPath), StandardCharsets.UTF_8);
                        return;
                    }
                }
            }
            // Fallback: carregar do classpath
            InputStream is = getClass().getResourceAsStream("/candidatos.json");
            if (is != null) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line).append("\n");
                    }
                    candidatosJson = sb.toString();
                }
            }
        } catch (Exception e) {
            candidatosJson = "{\"cargos\":[]}";
        }
    }

    /**
     * Recarrega os candidatos (útil para atualizar sem reiniciar o servidor).
     */
    public String recarregar() {
        carregarCandidatos();
        return null;
    }

    public String getCandidatosJson() {
        return candidatosJson != null ? candidatosJson : "{\"cargos\":[]}";
    }

    public void setCandidatosJson(String candidatosJson) {
        this.candidatosJson = candidatosJson;
    }

    public String getVersaoUrna() {
        return versaoUrna;
    }

    public String getAnoEleicao() {
        return anoEleicao;
    }
}

package br.com.urnabrasil;

import java.io.Serializable;

/**
 * Modelo de um candidato eleitoral.
 */
public class Candidato implements Serializable {

    private static final long serialVersionUID = 1L;

    private String numero;
    private String nome;
    private String nomeCompleto;
    private String partido;
    private String siglaPartido;
    private String vice;
    private String estado;
    private String foto;
    private String cor;

    public Candidato() {}

    public Candidato(String numero, String nome, String nomeCompleto,
                     String partido, String siglaPartido, String vice,
                     String estado, String foto, String cor) {
        this.numero = numero;
        this.nome = nome;
        this.nomeCompleto = nomeCompleto;
        this.partido = partido;
        this.siglaPartido = siglaPartido;
        this.vice = vice;
        this.estado = estado;
        this.foto = foto;
        this.cor = cor;
    }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getNomeCompleto() { return nomeCompleto; }
    public void setNomeCompleto(String nomeCompleto) { this.nomeCompleto = nomeCompleto; }

    public String getPartido() { return partido; }
    public void setPartido(String partido) { this.partido = partido; }

    public String getSiglaPartido() { return siglaPartido; }
    public void setSiglaPartido(String siglaPartido) { this.siglaPartido = siglaPartido; }

    public String getVice() { return vice; }
    public void setVice(String vice) { this.vice = vice; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getFoto() { return foto; }
    public void setFoto(String foto) { this.foto = foto; }

    public String getCor() { return cor; }
    public void setCor(String cor) { this.cor = cor; }
}

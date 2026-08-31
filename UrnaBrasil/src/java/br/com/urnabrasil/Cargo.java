package br.com.urnabrasil;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Modelo de um cargo eleitoral (Presidente, Governador, etc.)
 */
public class Cargo implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private String cargo;
    private int digitos;
    private String descricao;
    private List<Candidato> candidatos;

    public Cargo() {
        this.candidatos = new ArrayList<>();
    }

    public Cargo(String id, String cargo, int digitos, String descricao) {
        this.id = id;
        this.cargo = cargo;
        this.digitos = digitos;
        this.descricao = descricao;
        this.candidatos = new ArrayList<>();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }

    public int getDigitos() { return digitos; }
    public void setDigitos(int digitos) { this.digitos = digitos; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public List<Candidato> getCandidatos() { return candidatos; }
    public void setCandidatos(List<Candidato> candidatos) { this.candidatos = candidatos; }
}

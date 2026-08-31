package br.com.urnabrasil;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.PostConstruct;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.RequestScoped;

@ManagedBean(name = "apuracaoBean")
@RequestScoped
public class ApuracaoBean implements Serializable {

    private List<ResultadoCargo> resultadosPorCargo;

    @PostConstruct
    public void init() {
        calcularApuracao();
    }

    private void calcularApuracao() {
        resultadosPorCargo = new ArrayList<>();
        File file = new File(System.getProperty("user.home"), "urna_votos.txt");
        if (!file.exists()) {
            return;
        }

        // cargo -> (nomeCandidato -> qtdVotos)
        Map<String, Map<String, Integer>> mapaVotos = new HashMap<>();
        Map<String, Integer> totalPorCargo = new HashMap<>();

        try (BufferedReader br = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split("\\|");
                if (parts.length >= 2) {
                    String cargo = parts[0];
                    String tipo = parts[1]; // NOMINADO, BRANCO, NULO
                    String nome = "BRANCO/NULO";
                    
                    if (tipo.equals("NOMINADO") && parts.length >= 4) {
                        nome = parts[3];
                        if (nome == null || nome.trim().isEmpty()) {
                            nome = "Candidato " + parts[2];
                        }
                    } else if (tipo.equals("BRANCO")) {
                        nome = "VOTOS EM BRANCO";
                    } else if (tipo.equals("NULO")) {
                        nome = "VOTOS NULOS";
                    }

                    mapaVotos.putIfAbsent(cargo, new HashMap<>());
                    Map<String, Integer> votosCandidato = mapaVotos.get(cargo);
                    votosCandidato.put(nome, votosCandidato.getOrDefault(nome, 0) + 1);
                    
                    totalPorCargo.put(cargo, totalPorCargo.getOrDefault(cargo, 0) + 1);
                }
            }

            // Convert to list of ResultadoCargo
            for (Map.Entry<String, Map<String, Integer>> entry : mapaVotos.entrySet()) {
                String cargo = entry.getKey();
                int totalVotos = totalPorCargo.get(cargo);
                
                ResultadoCargo resCargo = new ResultadoCargo();
                resCargo.setCargo(cargo);
                resCargo.setTotalVotos(totalVotos);
                
                List<ResultadoCandidato> listaCand = new ArrayList<>();
                for (Map.Entry<String, Integer> candEntry : entry.getValue().entrySet()) {
                    ResultadoCandidato rc = new ResultadoCandidato();
                    rc.setNome(candEntry.getKey());
                    rc.setVotos(candEntry.getValue());
                    rc.setPercentual((rc.getVotos() * 100.0) / totalVotos);
                    listaCand.add(rc);
                }
                
                // Sort by votes descending
                listaCand.sort((c1, c2) -> Integer.compare(c2.getVotos(), c1.getVotos()));
                resCargo.setCandidatos(listaCand);
                
                resultadosPorCargo.add(resCargo);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<ResultadoCargo> getResultadosPorCargo() {
        return resultadosPorCargo;
    }

    // --- Inner classes for data structure ---
    
    public static class ResultadoCargo {
        private String cargo;
        private int totalVotos;
        private List<ResultadoCandidato> candidatos;

        public String getCargo() { return cargo; }
        public void setCargo(String cargo) { this.cargo = cargo; }
        public int getTotalVotos() { return totalVotos; }
        public void setTotalVotos(int totalVotos) { this.totalVotos = totalVotos; }
        public List<ResultadoCandidato> getCandidatos() { return candidatos; }
        public void setCandidatos(List<ResultadoCandidato> candidatos) { this.candidatos = candidatos; }
    }

    public static class ResultadoCandidato {
        private String nome;
        private int votos;
        private double percentual;

        public String getNome() { return nome; }
        public void setNome(String nome) { this.nome = nome; }
        public int getVotos() { return votos; }
        public void setVotos(int votos) { this.votos = votos; }
        public double getPercentual() { return percentual; }
        public void setPercentual(double percentual) { this.percentual = percentual; }
        public String getPercentualFormatado() {
            return String.format("%.2f%%", percentual);
        }
    }
}

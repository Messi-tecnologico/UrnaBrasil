package br.com.urnabrasil;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet(name = "SalvarVotoServlet", urlPatterns = {"/api/salvar-voto"})
public class SalvarVotoServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        // Read JSON body
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        String jsonPayload = sb.toString();

        if (jsonPayload != null && !jsonPayload.trim().isEmpty()) {
            // Save to a file in the user's home directory or temp to ensure write permissions
            // Or within the webapp if preferred, but home directory is safer for persistence across redeploys
            File file = new File(System.getProperty("user.home"), "urna_votos.txt");
            
            try (FileWriter fw = new FileWriter(file, true); 
                 PrintWriter pw = new PrintWriter(fw)) {
                // We just append the raw JSON string (array of votes) as a new line
                pw.println(jsonPayload);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"status\":\"ok\"}");
    }
}

package org.mortbay.ijetty.msx;

import java.io.IOException;
import java.io.PrintWriter;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


public final class Form extends HttpServlet {
    public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
    {
        doGet(request, response);
    }

    /* ------------------------------------------------------------ */
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
    {
        PrintWriter out = response.getWriter();

        String search_param = request.getParameter("search");

        String search_attribute = (String) getServletContext().getAttribute("search");
        if (search_attribute == null) {
            search_attribute = getServletContext().getInitParameter("search");
        }
        String search = search_param == null ? search_attribute : search_param;
        getServletContext().setAttribute("search", search);

        out.println("<!DOCTYPE html>");
        out.println("<html>");
        out.println("    <head>");
        out.println("        <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">");
        out.println("        <title>Search Youtube videos</title>");
        out.println("    </head>");
        out.println("    <body>");
        out.println("        <form method=\"post\">");
        out.println("            <div>");
        out.println("                <input type=\"text\" name=\"search\" required=\"required\" value=\"" + search + "\"/>");
        out.println("            </div>");
        out.println("            <div>");
        out.println("                <input type=\"submit\" value=\"Search Youtube\" />");
        out.println("            </div>");
        out.println("        </form>");
        out.println("    </body>");
        out.println("</html>");
        out.flush();
    }
}

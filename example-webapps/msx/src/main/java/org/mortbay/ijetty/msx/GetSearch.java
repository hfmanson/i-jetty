package org.mortbay.ijetty.msx;

import java.io.IOException;
import java.io.PrintWriter;
import javax.json.Json;
import javax.json.JsonArrayBuilder;
import javax.json.JsonBuilderFactory;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

public class GetSearch extends HttpServlet 
{
    private static String startString = "/url?q=https://www.youtube.com/watch%3Fv%3D";
    private static int startStringLength = startString.length();
    
    public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
    {
        doGet(request, response);
    }

    /* ------------------------------------------------------------ */
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
    {
        response.setContentType("application/json;charset=UTF-8");
        String search = (String) getServletContext().getAttribute("search");
        if (search == null) {
            search = "BWV 543";
        }
        JsonBuilderFactory factory = Json.createBuilderFactory(null);
        JsonObjectBuilder mediaxBuilder = factory.createObjectBuilder()
            .add("type", "pages")
            .add("headline", search)
            .add("template", factory.createObjectBuilder()
                .add("type", "separate")
                .add("layout", "0,0,3,3")
                .add("color", "black")
                .add("imageFiller", "cover"));
        JsonArrayBuilder itemsBuilder = factory.createArrayBuilder()
            .add(factory.createObjectBuilder()
                .add("title", "Refresh")
                .add("icon", "refresh")
                .add("action", "reload"));
        String ytURL = "https://www.google.com/search?q=" + search + "&tbm=vid";
        Document doc = Jsoup.connect(ytURL).userAgent("curl/8.9.1").get();
        Elements elements = doc.select("a[href^=\"" + startString + "\"]");
        String hrefOld = "";
        for (Element element : elements) {
            String href = element.attr("href").substring(startStringLength, startStringLength + 11);
            if (!href.equals(hrefOld)) {
                Elements titles = element.select("div > div > h3 > div");
                String title = titles.get(0).text();
                String baseURL = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + request.getContextPath();
                itemsBuilder.add(factory.createObjectBuilder()
                    .add("title", title)
                    .add("playerLabel", title)
                    .add("image", "https://img.youtube.com/vi/" + href + "/hqdefault.jpg")
                    .add("action", "video:plugin:" + baseURL + "/plugins/youtube.html?id=" + href));
                hrefOld = href;
            }
        }
        JsonObject mediax = mediaxBuilder
            .add("items", itemsBuilder.build())
            .build();
        PrintWriter out = response.getWriter();
        out.println(mediax.toString());
        out.flush();
    }    
}

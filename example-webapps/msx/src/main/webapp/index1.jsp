<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%
    String search_param = request.getParameter("search");
    String search_attribute = (String) application.getAttribute("search");
    if (search_attribute == null) {
        search_attribute = application.getInitParameter("search");
    }
    String search = search_param == null ? search_attribute : search_param;
    application.setAttribute("search", search);
%>
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Search Youtube videos</title>
    </head>
    <body>
        <form action="${request.contextPath}" method="post">
            <div>
                <input type="text" name="search" required="required" value="${search}"/>
            </div>
            <div>
                <input type="submit" value="Search Youtube" />
            </div>
        </form>
    </body>
</html>

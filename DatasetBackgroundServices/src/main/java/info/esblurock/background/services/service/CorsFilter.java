package info.esblurock.background.services.service;


import javax.servlet.*;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class CorsFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // Initialization code, if needed
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Allow cross-origin requests from any origin
        httpResponse.setHeader("Access-Control-Allow-Origin", "*");

        // Allow the OPTIONS method
        httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

        // Allow specific headers
        httpResponse.setHeader("Access-Control-Allow-Headers", 
        		"content-type,authorization,Access-Control-Allow-Origin,Access-Control-Allow-Methods,Access-Control-Allow-Headers");

        // Continue the chain
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        // Cleanup code, if needed
    }
}

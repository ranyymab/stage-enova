package com.enovarobotics.pguard.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class RateLimitFilterTest {

    @Test
    void allowsRequestsUnderTheLimit() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRemoteAddr("10.0.0.1");
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilterInternal(request, response, chain);

            assertEquals(200, response.getStatus(), "La requête n°" + (i + 1) + " devrait passer");
        }

        verify(chain, org.mockito.Mockito.times(10)).doFilter(
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void blocksRequestsOverTheLimitWith429() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        FilterChain chain = mock(FilterChain.class);
        MockHttpServletResponse lastResponse = null;

        for (int i = 0; i < 15; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRemoteAddr("10.0.0.2");
            lastResponse = new MockHttpServletResponse();
            filter.doFilterInternal(request, lastResponse, chain);
        }

        assertEquals(429, lastResponse.getStatus());
    }

    @Test
    void differentClientsAreTrackedIndependently() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRemoteAddr("10.0.0.3");
            filter.doFilterInternal(request, new MockHttpServletResponse(), chain);
        }

        MockHttpServletRequest requestB = new MockHttpServletRequest("POST", "/api/auth/login");
        requestB.setRemoteAddr("10.0.0.4");
        MockHttpServletResponse responseB = new MockHttpServletResponse();
        filter.doFilterInternal(requestB, responseB, chain);

        assertEquals(200, responseB.getStatus());
    }
}

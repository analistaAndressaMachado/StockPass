package com.stockpass.security;
import io.jsonwebtoken.Jwts; import io.jsonwebtoken.security.Keys; import jakarta.servlet.*; import jakarta.servlet.http.*; import org.springframework.beans.factory.annotation.Value; import org.springframework.security.authentication.UsernamePasswordAuthenticationToken; import org.springframework.security.core.authority.SimpleGrantedAuthority; import org.springframework.security.core.context.SecurityContextHolder; import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException; import java.nio.charset.StandardCharsets; import java.util.List;
@Component public class JwtAuthenticationFilter extends OncePerRequestFilter {

 @Value("${app.jwt.secret}") private String secret;
 private final com.stockpass.repository.UserRepository users;
 public JwtAuthenticationFilter(com.stockpass.repository.UserRepository users){this.users=users;}
 @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{String h=req.getHeader("Authorization"); if(h!=null&&h.startsWith("Bearer ")){try{var key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));String email=Jwts.parser().verifyWith(key).build().parseSignedClaims(h.substring(7)).getPayload().getSubject();users.findByEmailIgnoreCase(email).filter(com.stockpass.model.User::isActive).ifPresent(user->{var auth=new UsernamePasswordAuthenticationToken(email,null,List.of(new SimpleGrantedAuthority("ROLE_"+user.getRole())));SecurityContextHolder.getContext().setAuthentication(auth);});}catch(Exception ignored){}} chain.doFilter(req,res);}
}

package com.stockpass.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.http.HttpMethod;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.expression.WebExpressionAuthorizationManager;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.stockpass.security.JwtAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration @EnableWebSecurity
public class SecurityConfig {
 private final JwtAuthenticationFilter jwtFilter;
 public SecurityConfig(JwtAuthenticationFilter jwtFilter){this.jwtFilter=jwtFilter;}
 @Bean PasswordEncoder passwordEncoder(){ return new BCryptPasswordEncoder(); }
 @Bean SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
  return http.csrf(c->c.disable()).cors(c->{}).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
  .authorizeHttpRequests(a->a
  .requestMatchers("/api/hello-world","/api/auth/login","/api/auth/register","/api/auth/register-supplier","/api/auth/register-client","/api/auth/password/forgot","/api/auth/password/reset","/api/auth/password/demo-reset").permitAll()
  .requestMatchers(HttpMethod.PUT, "/api/auth/profile/photo").authenticated()
  .requestMatchers(HttpMethod.DELETE, "/api/auth/profile/photo").authenticated()
  .requestMatchers(HttpMethod.GET, "/api/media/users/**").authenticated()
  .requestMatchers("/api/store/**").hasRole("CLIENTE")
  .requestMatchers(HttpMethod.GET, "/api/clients", "/api/clients/**").hasAuthority("ACCESS_clientes_view")
  .requestMatchers("/api/clients", "/api/clients/**").hasAuthority("ACCESS_clientes_edit")
  .requestMatchers(HttpMethod.GET,"/api/users", "/api/users/**").hasAuthority("ACCESS_usuarios_view")
  .requestMatchers("/api/users", "/api/users/**").hasAuthority("ACCESS_usuarios_edit")
  .requestMatchers("/api/suppliers/offers/mine","/api/suppliers/offers/mine/**","/api/suppliers/purchases/mine","/api/suppliers/me").hasRole("FORNECEDOR")
   .requestMatchers(HttpMethod.GET,"/api/suppliers/offers").hasAuthority("ACCESS_fornecedores_view")
   .requestMatchers(HttpMethod.POST,"/api/suppliers/offers/*/acquire").hasAuthority("ACCESS_fornecedores_edit")
  .requestMatchers(HttpMethod.GET,"/api/suppliers/records/**","/api/suppliers/contracts/**").hasAuthority("ACCESS_fornecedores_view")
  .requestMatchers(HttpMethod.POST,"/api/suppliers/records/**","/api/suppliers/contracts/**")
    .access(new WebExpressionAuthorizationManager("hasAnyRole('GESTOR', 'ADMIN') and hasAuthority('ACCESS_fornecedores_edit')"))
  .requestMatchers(HttpMethod.PUT,"/api/suppliers/records/**","/api/suppliers/contracts/**")
    .access(new WebExpressionAuthorizationManager("hasAnyRole('GESTOR', 'ADMIN') and hasAuthority('ACCESS_fornecedores_edit')"))
  .requestMatchers(HttpMethod.DELETE,"/api/suppliers/records/**/attachments/**").hasAuthority("ACCESS_fornecedores_edit")
  .requestMatchers("/api/suppliers/records/**","/api/suppliers/contracts/**").denyAll()
  .requestMatchers("/api/suppliers/**").hasAnyRole("USER","GESTOR","ADMIN")
  .requestMatchers(HttpMethod.GET,"/api/products/**").hasAuthority("ACCESS_catalogo_view")
  .requestMatchers("/api/products/**").hasAuthority("ACCESS_catalogo_edit")
  .requestMatchers(HttpMethod.GET,"/api/entries/**","/api/replenishments/**").hasAuthority("ACCESS_entrada_view")
  .requestMatchers("/api/entries/**","/api/replenishments/**").hasAuthority("ACCESS_entrada_edit")
  .requestMatchers(HttpMethod.GET,"/api/exits/**").hasAuthority("ACCESS_saida_view")
  .requestMatchers("/api/exits/**").hasAuthority("ACCESS_saida_edit")
   .anyRequest().authenticated()).addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class).build();
 }
 @Bean CorsConfigurationSource corsConfigurationSource(){
  CorsConfiguration c=new CorsConfiguration(); c.setAllowedOrigins(List.of("http://localhost:5173","http://127.0.0.1:5173")); c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS")); c.setAllowedHeaders(List.of("*")); c.setAllowCredentials(true);
  UrlBasedCorsConfigurationSource s=new UrlBasedCorsConfigurationSource(); s.registerCorsConfiguration("/**",c); return s;
 }
}

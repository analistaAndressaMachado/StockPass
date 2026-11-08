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
  .requestMatchers("/api/store/**").hasRole("CLIENTE")
  .requestMatchers("/api/clients", "/api/clients/**").hasAnyRole("USER","GESTOR","ADMIN")
  .requestMatchers(HttpMethod.GET,"/api/users", "/api/users/**").hasAnyRole("GESTOR","ADMIN")
  .requestMatchers("/api/users", "/api/users/**").hasRole("ADMIN")
  .requestMatchers("/api/suppliers/offers/mine","/api/suppliers/offers/mine/**","/api/suppliers/purchases/mine","/api/suppliers/me").hasRole("FORNECEDOR")
   .requestMatchers(HttpMethod.GET,"/api/suppliers/offers").hasAnyRole("USER","GESTOR","ADMIN")
   .requestMatchers(HttpMethod.POST,"/api/suppliers/offers/*/acquire").hasAnyRole("USER","GESTOR","ADMIN")
  .requestMatchers("/api/suppliers/**").hasAnyRole("USER","GESTOR","ADMIN")
  .requestMatchers("/api/products/**","/api/entries/**","/api/exits/**","/api/replenishments/**").hasAnyRole("USER","GESTOR","ADMIN")
   .anyRequest().authenticated()).addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class).build();
 }
 @Bean CorsConfigurationSource corsConfigurationSource(){
  CorsConfiguration c=new CorsConfiguration(); c.setAllowedOrigins(List.of("http://localhost:5173","http://127.0.0.1:5173")); c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS")); c.setAllowedHeaders(List.of("*")); c.setAllowCredentials(true);
  UrlBasedCorsConfigurationSource s=new UrlBasedCorsConfigurationSource(); s.registerCorsConfiguration("/**",c); return s;
 }
}

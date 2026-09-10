package com.stockpass.controller;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api") public class HelloWorldController { @GetMapping("/hello-world") public Map<String,String> hello(){return Map.of("message","Hello World - StockPass");} }

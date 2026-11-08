package com.stockpass.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="users")
public class User {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false) private String name;
 @Column(nullable=false, unique=true) private String email;
 @Column(nullable=false) private String password;
 @Column(nullable=false) private String role="USER";
 private Boolean active;
 private LocalDateTime lastLoginAt;
 private String companyName;
 private String taxId;
 private String phone;
 @Column(nullable=false) private LocalDateTime createdAt=LocalDateTime.now();
 public boolean isActive(){return !Boolean.FALSE.equals(active);} public void setActive(boolean value){active=value;} public LocalDateTime getLastLoginAt(){return lastLoginAt;} public void setLastLoginAt(LocalDateTime value){lastLoginAt=value;}
 public Long getId(){return id;} public String getName(){return name;} public void setName(String v){name=v;} public String getEmail(){return email;} public void setEmail(String v){email=v;} public String getPassword(){return password;} public void setPassword(String v){password=v;} public String getRole(){return role;} public void setRole(String v){role=v;} public String getCompanyName(){return companyName;} public void setCompanyName(String v){companyName=v;} public String getTaxId(){return taxId;} public void setTaxId(String v){taxId=v;} public String getPhone(){return phone;} public void setPhone(String v){phone=v;} public LocalDateTime getCreatedAt(){return createdAt;}
}

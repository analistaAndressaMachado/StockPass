package com.stockpass.repository;
import com.stockpass.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
public interface UserRepository extends JpaRepository<User,Long>{ Optional<User> findByEmailIgnoreCase(String email); boolean existsByEmailIgnoreCase(String email); boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id); List<User> findAllByRoleOrderByNameAsc(String role); }

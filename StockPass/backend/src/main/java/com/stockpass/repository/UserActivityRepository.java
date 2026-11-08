package com.stockpass.repository;

import com.stockpass.model.UserActivity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    List<UserActivity> findAllByOrderByCreatedAtDescIdDesc();
}
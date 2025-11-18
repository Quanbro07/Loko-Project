package com.exproject.backend.user;

import com.exproject.backend.user.dto.UserResponse;
import com.exproject.backend.user.info.Gender;
import com.exproject.backend.user.info.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("api/v1/user")
public class UserController {

    private final UserService userService;

    // test API end-point
    @GetMapping("/test")
    public String test() {
        return "Hello World from User end-point";
    }

    @GetMapping("/getUser")
    @PreAuthorize("authentication.principal.id == #id or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@RequestParam Long id) {
        UserResponse userResponse = userService.getUser(id);

        return ResponseEntity.ok(userResponse);
    }
}

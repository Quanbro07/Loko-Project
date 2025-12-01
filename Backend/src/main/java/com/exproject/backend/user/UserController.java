package com.exproject.backend.user;

import com.exproject.backend.user.dto.UserDTO;
import com.exproject.backend.user.dto.UserResponse;
import com.exproject.backend.user.info.Gender;
import com.exproject.backend.user.info.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    @GetMapping("/getAll")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @PageableDefault(page=0,size=20,sort="id",direction = Sort.Direction.ASC)
            Pageable page) {

        Page<UserResponse> response = userService.getAllUsers(page);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/disable")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> disableUser(@RequestParam Long userId) {
        userService.disableUser(userId);

        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("authentication.principal.id == #userDTO.getUserId() " +
            "or hasAuthority('ROLE_ADMIN')")
    @PostMapping("/change-info")
    public ResponseEntity<UserDTO> changeInfoUser(@RequestBody UserDTO userDTO) {
        UserDTO response = userService.changeUserInfo(userDTO);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/enable")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> enableUser(@RequestParam Long userId) {
        userService.enableUser(userId);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/delete")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteUser(@RequestParam Long userId) {
        userService.deleteUser(userId);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upgrade")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> upgradeUser(@RequestParam Long userId,
        @RequestParam(defaultValue = "7") Integer duration) {
        userService.upgradeUser(userId,duration);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/downgrade")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> downgradeUser(@RequestParam Long userId) {
        userService.downgradeUser(userId);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upgrade-duration")
    public ResponseEntity<Void> upgradeDuration(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "1") Integer duration) {

        userService.upgradeUser(user.getId(),duration);

        return ResponseEntity.noContent().build();
    }
}

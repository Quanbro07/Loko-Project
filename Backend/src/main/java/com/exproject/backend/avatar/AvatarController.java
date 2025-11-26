package com.exproject.backend.avatar;

import com.exproject.backend.avatar.dto.AvatarDTO;
import com.exproject.backend.user.info.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RequiredArgsConstructor
@RestController
@RequestMapping("api/v1/avatar")
public class AvatarController {

    private final AvatarService avatarService;

    @PostMapping("/change")
    public ResponseEntity<AvatarDTO> changeAvatar(
            @AuthenticationPrincipal User user,
            @RequestParam("avatar")MultipartFile file) throws IOException {

        AvatarDTO response  = avatarService.changeAvatarImg(user.getId(),file);

        return ResponseEntity.status(HttpStatus.OK)
                .body(response);
    }

    @GetMapping("/get")
    public ResponseEntity<?> getAvatar(@AuthenticationPrincipal User user) {
        byte[] avatar = avatarService.getAvatarImg(user.getId());

        return ResponseEntity.status(HttpStatus.OK)
                .contentType(MediaType.valueOf("image/jpeg"))
                .body(avatar);
    }


}

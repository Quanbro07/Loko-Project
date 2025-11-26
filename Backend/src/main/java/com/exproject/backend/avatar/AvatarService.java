package com.exproject.backend.avatar;

import com.exproject.backend.avatar.dto.AvatarDTO;
import com.exproject.backend.user.UserRepository;
import com.exproject.backend.user.info.User;
import com.exproject.backend.utils.ImgUltils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AvatarService {

    private final AvatarRepository avatarRepository;

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public byte[] getAvatarImg(Long userId) {

        return avatarRepository.findByUserId(userId)
                .map(avatar -> ImgUltils.decompressImage(avatar.getAvatarImg()))
                .orElse(null);
    }

    @Transactional
    public AvatarDTO changeAvatarImg(Long userId, MultipartFile file) throws IOException {
        User user = userRepository.findById(userId).
                orElseThrow(() -> new RuntimeException("User not found"));

        Avatar avatar = avatarRepository.findByUserId(userId)
                .orElseGet(() -> {
                    return Avatar.builder()
                            .user(user)
                            .build();
                });

        avatar.setType(file.getContentType());
        avatar.setAvatarImg(ImgUltils.compressImage(file.getBytes()));

        user.addAvatar(avatar);

        userRepository.save(user);

        return mapToDTO(avatar);

    }

    // Helper Funciton
    private AvatarDTO mapToDTO(Avatar avatar) {
        return AvatarDTO.builder()
                .userId(avatar.getUser().getId())
                .type(avatar.getType())
                .message("Change avatar sucessful")
                .build();
    }
}

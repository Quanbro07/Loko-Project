package com.exproject.backend.user;

import com.exproject.backend.exception.customException.CannotDisableAdminException;
import com.exproject.backend.user.dto.UserDTO;
import com.exproject.backend.user.dto.UserResponse;
import com.exproject.backend.user.info.Role;
import com.exproject.backend.user.info.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getUser(Long id) {
        User existUser = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not Found"));

        UserResponse userResponse = this.convertToUserResponse(existUser);

        return userResponse;
    }

    public void disableUser(Long userId) {
        User existUser = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not Found"));

        if(existUser.getRole() == Role.ADMIN) {
            throw new CannotDisableAdminException("You can't disable user admin");
        }

        // Disable user
        existUser.setEnabled(false);

        userRepository.save(existUser);
    }

    public Page<UserResponse> getAllUsers(Pageable page) {
        Role admin = Role.ADMIN;

        Page<User> userList = userRepository.findAllByRoleNot(admin, page);

        Page<UserResponse> userResponseList = userList.map(this::convertToUserResponse);

        return userResponseList;
    }

    public UserDTO changeUserInfo(UserDTO dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new UsernameNotFoundException("User not Found"));

        user.setUsername(dto.getUserName());
        user.setFullName(dto.getFullName());
        user.setDob(dto.getDob());
        user.setGender(dto.getGender());

        User savedUser = userRepository.save(user);

        return UserMapToDTO(savedUser);
    }

    // Helper Function
    private UserDTO UserMapToDTO(User user) {
        return UserDTO.builder()
                .userId(user.getId())
                .userName(user.getDisplayUserName())
                .fullName(user.getFullName())
                .dob(user.getDob())
                .gender(user.getGender())
                .build();
    }


    private UserResponse convertToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getDisplayUserName())
                .email(user.getEmail())
                .age(user.getAge())
                .gender(user.getGender())
                .role(user.getRole())
                .build();
    }
}

package com.exproject.backend.user;

import com.exproject.backend.exception.customException.CannotDisableAdminException;
import com.exproject.backend.user.dto.UserDTO;
import com.exproject.backend.user.dto.UserResponse;
import com.exproject.backend.user.info.Role;
import com.exproject.backend.user.info.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

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

    public void enableUser(Long userId) {
        User existUser = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not Found"));


        // Enable user
        existUser.setEnabled(true);

        userRepository.save(existUser);
    }

    public void deleteUser(Long userId) {
        User existUser = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not Found"));

        if(existUser.getRole() == Role.ADMIN) {
            throw new CannotDisableAdminException("You can't delete user admin");
        }

        userRepository.delete(existUser);

    }

    public void upgradeUser(Long userId,Integer duration) {
        User existUser = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not Found"));

        if(existUser.getRole() == Role.ADMIN) {
            throw new CannotDisableAdminException("You can't upgrade user admin");
        }

        else if(existUser.getRole() == Role.VIP) {
            throw new RuntimeException("User already has VIP role");
        }

        existUser.setRole(Role.VIP);

        // Set default khi admin bật lên là 7 ngày
        existUser.setVipEndDate(LocalDate.now().plusDays(duration));

        userRepository.save(existUser);
    }

    public void downgradeUser(Long userId) {
        User existUser = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not Found"));

        if(existUser.getRole() == Role.ADMIN) {
            throw new CannotDisableAdminException("You can't upgrade user admin");
        }

        existUser.setRole(Role.USER);

        // Ko phải VIP thì ko cần trường này
        existUser.setVipEndDate(null);

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
                .enabled(user.isEnabled())
                .build();
    }

    public void downgradeUserSchedule() {

        int pageSize = 100;

        Pageable pageable = PageRequest.of(0, pageSize);

        LocalDate today = LocalDate.now();

        Page<User> users;

        do {
            users = userRepository.findAllRoleUserAndExpireDateBefore(Role.VIP, today, pageable);

            if(users.getContent().isEmpty()) {
                break;
            }

            for(User user: users.getContent()) {
                user.setRole(Role.USER);
                user.setVipEndDate(null);
            }

            userRepository.saveAll(users.getContent());

            System.out.println("Đã xử lý batch " + users.getNumberOfElements() + " users.");
        } while (users.hasNext());
    }


}

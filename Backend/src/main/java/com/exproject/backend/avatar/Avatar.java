package com.exproject.backend.avatar;

import com.exproject.backend.user.info.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;

import java.sql.Types;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Entity
@Table(name = "avatar_img")
public class Avatar {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;

    @Lob
    @JdbcTypeCode(Types.VARBINARY)
    @JoinColumn(name = "avatar_img")
    private byte[] avatarImg;

    @OneToOne(mappedBy = "avatar")
    private User user;
}

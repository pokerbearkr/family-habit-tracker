package com.habittracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private String displayName;
    private Long familyId;
    private String familyName;

    public JwtResponse(String token, Long id, String username, String email, String displayName, Long familyId, String familyName) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.displayName = displayName;
        this.familyId = familyId;
        this.familyName = familyName;
    }
}

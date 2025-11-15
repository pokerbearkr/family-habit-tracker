package com.habittracker.dto;

import com.habittracker.entity.Family;
import com.habittracker.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FamilyResponse {
    private Long id;
    private String name;
    private String inviteCode;
    private List<UserSummary> members;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String username;
        private String displayName;
        private String email;
    }

    public static FamilyResponse from(Family family) {
        FamilyResponse response = new FamilyResponse();
        response.setId(family.getId());
        response.setName(family.getName());
        response.setInviteCode(family.getInviteCode());

        if (family.getMembers() != null) {
            response.setMembers(
                family.getMembers().stream()
                    .map(user -> new UserSummary(
                        user.getId(),
                        user.getUsername(),
                        user.getDisplayName(),
                        user.getEmail()
                    ))
                    .collect(Collectors.toList())
            );
        }

        return response;
    }
}

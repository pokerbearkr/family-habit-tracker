package com.habittracker.service;

import com.habittracker.dto.CreateFamilyRequest;
import com.habittracker.entity.Family;
import com.habittracker.entity.User;
import com.habittracker.repository.FamilyRepository;
import com.habittracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyRepository familyRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    @Transactional
    public Family createFamily(CreateFamilyRequest request) {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getFamily() != null) {
            throw new RuntimeException("User already belongs to a family");
        }

        // Generate unique invite code
        String inviteCode = generateUniqueInviteCode();

        Family family = Family.builder()
                .name(request.getName())
                .inviteCode(inviteCode)
                .build();

        family = familyRepository.save(family);

        // Add current user to the family
        currentUser.setFamily(family);
        userRepository.save(currentUser);

        return family;
    }

    @Transactional
    public Family joinFamily(String inviteCode) {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getFamily() != null) {
            throw new RuntimeException("User already belongs to a family");
        }

        Family family = familyRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Invalid invite code"));

        currentUser.setFamily(family);
        userRepository.save(currentUser);

        return family;
    }

    @Transactional(readOnly = true)
    public Family getMyFamily() {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getFamily() == null) {
            throw new RuntimeException("User does not belong to any family");
        }

        return currentUser.getFamily();
    }

    @Transactional
    public void leaveFamily() {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getFamily() == null) {
            throw new RuntimeException("User does not belong to any family");
        }

        currentUser.setFamily(null);
        userRepository.save(currentUser);
    }

    @Transactional
    public Family updateFamilyName(String newName) {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getFamily() == null) {
            throw new RuntimeException("User does not belong to any family");
        }

        Family family = currentUser.getFamily();
        family.setName(newName);
        return familyRepository.save(family);
    }

    private String generateUniqueInviteCode() {
        String inviteCode;
        do {
            inviteCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (familyRepository.existsByInviteCode(inviteCode));
        return inviteCode;
    }
}

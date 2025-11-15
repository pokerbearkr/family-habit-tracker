package com.habittracker.controller;

import com.habittracker.dto.CreateFamilyRequest;
import com.habittracker.dto.FamilyResponse;
import com.habittracker.entity.Family;
import com.habittracker.service.FamilyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/family")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;

    @PostMapping("/create")
    public ResponseEntity<FamilyResponse> createFamily(@Valid @RequestBody CreateFamilyRequest request) {
        Family family = familyService.createFamily(request);
        return ResponseEntity.ok(FamilyResponse.from(family));
    }

    @PostMapping("/join/{inviteCode}")
    public ResponseEntity<FamilyResponse> joinFamily(@PathVariable String inviteCode) {
        Family family = familyService.joinFamily(inviteCode);
        return ResponseEntity.ok(FamilyResponse.from(family));
    }

    @GetMapping("/my")
    public ResponseEntity<FamilyResponse> getMyFamily() {
        Family family = familyService.getMyFamily();
        return ResponseEntity.ok(FamilyResponse.from(family));
    }

    @PostMapping("/leave")
    public ResponseEntity<String> leaveFamily() {
        familyService.leaveFamily();
        return ResponseEntity.ok("Successfully left the family");
    }
}

package com.habittracker.controller;

import com.habittracker.dto.HealthRecordRequest;
import com.habittracker.dto.HealthRecordResponse;
import com.habittracker.entity.HealthRecord.RecordType;
import com.habittracker.service.HealthRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/health")
public class HealthRecordController {

    @Autowired
    private HealthRecordService healthRecordService;

    @PostMapping
    public ResponseEntity<HealthRecordResponse> create(@RequestBody HealthRecordRequest request) {
        HealthRecordResponse response = healthRecordService.create(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<HealthRecordResponse> update(
            @PathVariable Long id,
            @RequestBody HealthRecordRequest request) {
        HealthRecordResponse response = healthRecordService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        healthRecordService.delete(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/my")
    public ResponseEntity<List<HealthRecordResponse>> getMyRecords(
            @RequestParam(required = false) RecordType type,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<HealthRecordResponse> records = healthRecordService.getMyRecords(type, startDate, endDate);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/family")
    public ResponseEntity<List<HealthRecordResponse>> getFamilyRecords(
            @RequestParam(required = false) RecordType type,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<HealthRecordResponse> records = healthRecordService.getFamilyRecords(type, startDate, endDate);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<HealthRecordResponse>> getRecentRecords(@RequestParam RecordType type) {
        List<HealthRecordResponse> records = healthRecordService.getRecentRecords(type);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/chart")
    public ResponseEntity<List<HealthRecordResponse>> getChartData(
            @RequestParam RecordType type,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<HealthRecordResponse> records = healthRecordService.getChartData(type, startDate, endDate);
        return ResponseEntity.ok(records);
    }
}

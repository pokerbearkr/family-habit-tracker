package com.habittracker.service;

import com.habittracker.dto.HealthRecordRequest;
import com.habittracker.dto.HealthRecordResponse;
import com.habittracker.entity.Family;
import com.habittracker.entity.HealthRecord;
import com.habittracker.entity.HealthRecord.RecordType;
import com.habittracker.entity.User;
import com.habittracker.repository.FamilyRepository;
import com.habittracker.repository.HealthRecordRepository;
import com.habittracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class HealthRecordService {

    @Autowired
    private HealthRecordRepository healthRecordRepository;

    @Autowired
    private AuthService authService;

    public HealthRecordResponse create(HealthRecordRequest request) {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getFamily() == null) {
            throw new RuntimeException("User must belong to a family");
        }

        HealthRecord record = new HealthRecord();
        record.setUser(currentUser);
        record.setFamily(currentUser.getFamily());
        record.setRecordType(request.getRecordType());
        record.setRecordDate(request.getRecordDate() != null ? request.getRecordDate() : LocalDate.now());
        record.setSystolic(request.getSystolic());
        record.setDiastolic(request.getDiastolic());
        record.setHeartRate(request.getHeartRate());
        record.setWeight(request.getWeight());
        record.setBloodSugar(request.getBloodSugar());
        record.setNote(request.getNote());
        record.setMeasureTime(request.getMeasureTime());

        HealthRecord saved = healthRecordRepository.save(record);
        return HealthRecordResponse.from(saved);
    }

    public HealthRecordResponse update(Long recordId, HealthRecordRequest request) {
        User currentUser = authService.getCurrentUser();

        HealthRecord record = healthRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Record not found"));

        // 본인 기록만 수정 가능
        if (!record.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Cannot update other user's record");
        }

        record.setRecordDate(request.getRecordDate() != null ? request.getRecordDate() : record.getRecordDate());
        record.setSystolic(request.getSystolic());
        record.setDiastolic(request.getDiastolic());
        record.setHeartRate(request.getHeartRate());
        record.setWeight(request.getWeight());
        record.setBloodSugar(request.getBloodSugar());
        record.setNote(request.getNote());
        record.setMeasureTime(request.getMeasureTime());

        HealthRecord saved = healthRecordRepository.save(record);
        return HealthRecordResponse.from(saved);
    }

    public void delete(Long recordId) {
        User currentUser = authService.getCurrentUser();

        HealthRecord record = healthRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Record not found"));

        // 본인 기록만 삭제 가능
        if (!record.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Cannot delete other user's record");
        }

        healthRecordRepository.delete(record);
    }

    @Transactional(readOnly = true)
    public List<HealthRecordResponse> getMyRecords(RecordType recordType,
                                                    LocalDate startDate, LocalDate endDate) {
        User currentUser = authService.getCurrentUser();

        List<HealthRecord> records;
        if (recordType != null) {
            records = healthRecordRepository
                    .findByUserIdAndRecordTypeAndRecordDateBetweenOrderByRecordDateDescCreatedAtDesc(
                            currentUser.getId(), recordType, startDate, endDate);
        } else {
            records = healthRecordRepository
                    .findByUserIdAndRecordDateBetweenOrderByRecordDateDescCreatedAtDesc(
                            currentUser.getId(), startDate, endDate);
        }
        return records.stream().map(HealthRecordResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HealthRecordResponse> getFamilyRecords(RecordType recordType,
                                                        LocalDate startDate, LocalDate endDate) {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getFamily() == null) {
            throw new RuntimeException("User must belong to a family");
        }

        List<HealthRecord> records;
        if (recordType != null) {
            records = healthRecordRepository
                    .findByFamilyIdAndRecordTypeAndRecordDateBetweenOrderByRecordDateDescCreatedAtDesc(
                            currentUser.getFamily().getId(), recordType, startDate, endDate);
        } else {
            records = healthRecordRepository
                    .findByFamilyIdAndRecordDateBetweenOrderByRecordDateDescCreatedAtDesc(
                            currentUser.getFamily().getId(), startDate, endDate);
        }
        return records.stream().map(HealthRecordResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HealthRecordResponse> getRecentRecords(RecordType recordType) {
        User currentUser = authService.getCurrentUser();

        List<HealthRecord> records = healthRecordRepository
                .findTop30ByUserIdAndRecordTypeOrderByRecordDateDescCreatedAtDesc(currentUser.getId(), recordType);
        return records.stream().map(HealthRecordResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HealthRecordResponse> getChartData(RecordType recordType,
                                                    LocalDate startDate, LocalDate endDate) {
        User currentUser = authService.getCurrentUser();

        List<HealthRecord> records = healthRecordRepository
                .findForChart(currentUser.getId(), recordType, startDate, endDate);
        return records.stream().map(HealthRecordResponse::from).collect(Collectors.toList());
    }
}

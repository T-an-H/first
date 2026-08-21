package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.StudentTier;
import com.course.backend.service.StudentTierService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * AI 分层记录接口
 */
@RestController
@RequestMapping("/api/teaching")
@RequiredArgsConstructor
public class StudentTierController {

    private final StudentTierService studentTierService;

    /**
     * GET /api/teaching/student-tiers  分层记录列表
     * 可选参数：courseId / studentId / tier
     */
    @GetMapping("/student-tiers")
    public Result<List<StudentTier>> listTiers(
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String tier) {
        QueryWrapper<StudentTier> qw = new QueryWrapper<>();
        if (StringUtils.hasText(courseId)) qw.eq("course_id", courseId);
        if (StringUtils.hasText(studentId)) qw.eq("student_id", studentId);
        if (StringUtils.hasText(tier)) qw.eq("tier", tier);
        qw.orderByDesc("created_at");
        return Result.ok(studentTierService.list(qw));
    }

    /**
     * POST /api/teaching/student-tiers  新增分层记录
     * body: { id?, courseId, studentId, tier, score? }
     */
    @PostMapping("/student-tiers")
    public Result<StudentTier> addTier(@RequestBody StudentTier tier) {
        if (!StringUtils.hasText(tier.getId())) {
            tier.setId("tier-" + System.currentTimeMillis());
        }
        if (tier.getScore() == null) tier.setScore(0);
        studentTierService.save(tier);
        return Result.ok(tier);
    }

    /**
     * PUT /api/teaching/student-tiers/{id}  更新分层记录（改层级/得分）
     */
    @PutMapping("/student-tiers/{id}")
    public Result<StudentTier> updateTier(@PathVariable String id, @RequestBody StudentTier tier) {
        tier.setId(id);
        studentTierService.updateById(tier);
        return Result.ok(studentTierService.getById(id));
    }

    /**
     * DELETE /api/teaching/student-tiers/{id}  删除分层记录
     */
    @DeleteMapping("/student-tiers/{id}")
    public Result<Void> deleteTier(@PathVariable String id) {
        studentTierService.removeById(id);
        return Result.ok();
    }
}

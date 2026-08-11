package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.HomeworkSubmission;
import com.course.backend.service.HomeworkSubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 作业提交接口
 */
@RestController
@RequestMapping("/api/teaching")
@RequiredArgsConstructor
public class HomeworkSubmissionController {

    private final HomeworkSubmissionService homeworkSubmissionService;

    /**
     * GET /api/teaching/homework-submissions  作业提交列表
     * 可选参数：homeworkId / courseId / studentId
     */
    @GetMapping("/homework-submissions")
    public Result<List<HomeworkSubmission>> listSubmissions(
            @RequestParam(required = false) String homeworkId,
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String studentId) {
        QueryWrapper<HomeworkSubmission> qw = new QueryWrapper<>();
        if (StringUtils.hasText(homeworkId)) qw.eq("homework_id", homeworkId);
        if (StringUtils.hasText(courseId)) qw.eq("course_id", courseId);
        if (StringUtils.hasText(studentId)) qw.eq("student_id", studentId);
        qw.orderByDesc("submitted_at");
        return Result.ok(homeworkSubmissionService.list(qw));
    }

    /**
     * POST /api/teaching/homework-submissions  新增作业提交
     */
    @PostMapping("/homework-submissions")
    public Result<HomeworkSubmission> addSubmission(@RequestBody HomeworkSubmission submission) {
        if (!StringUtils.hasText(submission.getId())) {
            submission.setId("hs-" + System.currentTimeMillis());
        }
        homeworkSubmissionService.save(submission);
        return Result.ok(submission);
    }

    /**
     * DELETE /api/teaching/homework-submissions/{id}  删除作业提交
     */
    @DeleteMapping("/homework-submissions/{id}")
    public Result<Void> deleteSubmission(@PathVariable String id) {
        homeworkSubmissionService.removeById(id);
        return Result.ok();
    }
}

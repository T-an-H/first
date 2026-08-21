package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.EvalReminder;
import com.course.backend.service.EvalReminderService;
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
 * 评价提醒接口
 */
@RestController
@RequestMapping("/api/teaching")
@RequiredArgsConstructor
public class EvalReminderController {

    private final EvalReminderService evalReminderService;

    /**
     * GET /api/teaching/eval-reminders  评价提醒列表
     * 可选参数：courseId / studentId / status
     */
    @GetMapping("/eval-reminders")
    public Result<List<EvalReminder>> listReminders(
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String status) {
        QueryWrapper<EvalReminder> qw = new QueryWrapper<>();
        if (StringUtils.hasText(courseId)) qw.eq("course_id", courseId);
        if (StringUtils.hasText(studentId)) qw.eq("student_id", studentId);
        if (StringUtils.hasText(status)) qw.eq("status", status);
        qw.orderByAsc("deadline");
        return Result.ok(evalReminderService.list(qw));
    }

    /**
     * POST /api/teaching/eval-reminders  新增评价提醒
     */
    @PostMapping("/eval-reminders")
    public Result<EvalReminder> addReminder(@RequestBody EvalReminder reminder) {
        if (!StringUtils.hasText(reminder.getId())) {
            reminder.setId("er-" + System.currentTimeMillis());
        }
        if (reminder.getSessionNumber() == null) reminder.setSessionNumber(1);
        if (!StringUtils.hasText(reminder.getStatus())) reminder.setStatus("pending");
        evalReminderService.save(reminder);
        return Result.ok(reminder);
    }

    /**
     * PUT /api/teaching/eval-reminders/{id}  更新评价提醒（标记完成/逾期等）
     */
    @PutMapping("/eval-reminders/{id}")
    public Result<EvalReminder> updateReminder(@PathVariable String id, @RequestBody EvalReminder reminder) {
        reminder.setId(id);
        evalReminderService.updateById(reminder);
        return Result.ok(evalReminderService.getById(id));
    }

    /**
     * DELETE /api/teaching/eval-reminders/{id}  删除评价提醒
     */
    @DeleteMapping("/eval-reminders/{id}")
    public Result<Void> deleteReminder(@PathVariable String id) {
        evalReminderService.removeById(id);
        return Result.ok();
    }
}

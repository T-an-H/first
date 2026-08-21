package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.Note;
import com.course.backend.service.NoteService;
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
 * 笔记接口
 */
@RestController
@RequestMapping("/api/teaching")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    /**
     * GET /api/teaching/notes  笔记列表
     * 可选参数：createdBy
     */
    @GetMapping("/notes")
    public Result<List<Note>> listNotes(@RequestParam(required = false) String createdBy) {
        QueryWrapper<Note> qw = new QueryWrapper<>();
        if (StringUtils.hasText(createdBy)) qw.eq("created_by", createdBy);
        qw.orderByDesc("updated_at");
        return Result.ok(noteService.list(qw));
    }

    /**
     * POST /api/teaching/notes  新增笔记
     * body: { id?, title, content?, createdBy, attachments? }
     */
    @PostMapping("/notes")
    public Result<Note> addNote(@RequestBody Note note) {
        if (!StringUtils.hasText(note.getId())) {
            note.setId("note-" + System.currentTimeMillis());
        }
        noteService.save(note);
        return Result.ok(note);
    }

    /**
     * PUT /api/teaching/notes/{id}  更新笔记（标题/内容/附件）
     */
    @PutMapping("/notes/{id}")
    public Result<Note> updateNote(@PathVariable String id, @RequestBody Note note) {
        note.setId(id);
        noteService.updateById(note);
        return Result.ok(noteService.getById(id));
    }

    /**
     * DELETE /api/teaching/notes/{id}  删除笔记
     */
    @DeleteMapping("/notes/{id}")
    public Result<Void> deleteNote(@PathVariable String id) {
        noteService.removeById(id);
        return Result.ok();
    }
}

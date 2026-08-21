package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.CourseEvalQuestionnaire;
import com.course.backend.entity.CourseEvalResponse;
import com.course.backend.entity.CourseProject;
import com.course.backend.entity.CourseProjectFile;
import com.course.backend.entity.CourseProjectProgress;
import com.course.backend.mapper.CourseEvalQuestionnaireMapper;
import com.course.backend.mapper.CourseEvalResponseMapper;
import com.course.backend.mapper.CourseProjectFileMapper;
import com.course.backend.mapper.CourseProjectMapper;
import com.course.backend.mapper.CourseProjectProgressMapper;
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

import java.util.ArrayList;
import java.util.List;

/**
 * 课程管理（知识图谱）项目接口：
 * - 项目 course_project（每 2 学时一个项目）
 * - 项目文件 course_project_file（预习/工单/资料/测试题目）
 * - 项目进度 course_project_progress（学生预习/工单提交/资料查看/测试完成）
 * - 评教问卷 course_eval_questionnaire + course_eval_response
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectController {

    private final CourseProjectMapper projectMapper;
    private final CourseProjectFileMapper projectFileMapper;
    private final CourseProjectProgressMapper projectProgressMapper;
    private final CourseEvalQuestionnaireMapper questionnaireMapper;
    private final CourseEvalResponseMapper evalResponseMapper;

    // ==================== 项目 Project ====================

    /**
     * GET /api/projects?courseId=xxx  项目列表（按 order_no 排序）
     */
    @GetMapping("/projects")
    public Result<List<CourseProject>> listProjects(@RequestParam(required = false) String courseId) {
        QueryWrapper<CourseProject> qw = new QueryWrapper<>();
        if (StringUtils.hasText(courseId)) qw.eq("course_id", courseId);
        qw.orderByAsc("order_no");
        return Result.ok(projectMapper.selectList(qw));
    }

    /**
     * GET /api/projects/{id}  项目详情
     */
    @GetMapping("/projects/{id}")
    public Result<CourseProject> getProject(@PathVariable String id) {
        return Result.ok(projectMapper.selectById(id));
    }

    /**
     * POST /api/projects  新增项目
     */
    @PostMapping("/projects")
    public Result<CourseProject> addProject(@RequestBody CourseProject project) {
        if (!StringUtils.hasText(project.getId())) {
            project.setId("proj-" + System.currentTimeMillis());
        }
        if (project.getHours() == null) project.setHours(2);
        if (project.getOrderNo() == null) project.setOrderNo(0);
        projectMapper.insert(project);
        return Result.ok(projectMapper.selectById(project.getId()));
    }

    /**
     * POST /api/projects/bulk  批量新增项目（Excel 解析结果）
     * body: [ { name, hours, content, keyPoints, knowledgePoints, orderNo, weekNo }, ... ]
     */
    @PostMapping("/projects/bulk")
    public Result<List<CourseProject>> addProjectsBulk(@RequestBody List<CourseProject> projects) {
        List<CourseProject> saved = new ArrayList<>();
        long base = System.currentTimeMillis();
        for (int i = 0; i < projects.size(); i++) {
            CourseProject p = projects.get(i);
            if (!StringUtils.hasText(p.getId())) {
                p.setId("proj-" + base + "-" + i);
            }
            if (p.getHours() == null) p.setHours(2);
            if (p.getOrderNo() == null) p.setOrderNo(i);
            projectMapper.insert(p);
            saved.add(p);
        }
        return Result.ok(saved);
    }

    /**
     * PUT /api/projects/{id}  更新项目
     */
    @PutMapping("/projects/{id}")
    public Result<CourseProject> updateProject(@PathVariable String id, @RequestBody CourseProject project) {
        project.setId(id);
        projectMapper.updateById(project);
        return Result.ok(projectMapper.selectById(id));
    }

    /**
     * DELETE /api/projects/{id}  删除项目（级联删除文件与进度）
     */
    @DeleteMapping("/projects/{id}")
    public Result<Void> deleteProject(@PathVariable String id) {
        projectMapper.deleteById(id);
        projectFileMapper.delete(new QueryWrapper<CourseProjectFile>().eq("project_id", id));
        projectProgressMapper.delete(new QueryWrapper<CourseProjectProgress>().eq("project_id", id));
        return Result.ok();
    }

    // ==================== 项目文件 ProjectFile ====================

    /**
     * GET /api/projects/{projectId}/files?fileType=xxx  项目文件列表
     */
    @GetMapping("/projects/{projectId}/files")
    public Result<List<CourseProjectFile>> listProjectFiles(
            @PathVariable String projectId,
            @RequestParam(required = false) String fileType) {
        QueryWrapper<CourseProjectFile> qw = new QueryWrapper<>();
        qw.eq("project_id", projectId);
        if (StringUtils.hasText(fileType)) qw.eq("file_type", fileType);
        qw.orderByAsc("created_at");
        return Result.ok(projectFileMapper.selectList(qw));
    }

    /**
     * POST /api/projects/files  新增项目文件
     */
    @PostMapping("/projects/files")
    public Result<CourseProjectFile> addProjectFile(@RequestBody CourseProjectFile file) {
        if (!StringUtils.hasText(file.getId())) {
            file.setId("pfile-" + System.currentTimeMillis());
        }
        projectFileMapper.insert(file);
        return Result.ok(file);
    }

    /**
     * DELETE /api/projects/files/{id}  删除项目文件
     */
    @DeleteMapping("/projects/files/{id}")
    public Result<Void> deleteProjectFile(@PathVariable String id) {
        projectFileMapper.deleteById(id);
        return Result.ok();
    }

    // ==================== 项目进度 ProjectProgress ====================

    /**
     * GET /api/projects/{projectId}/progress  项目全部学生进度
     */
    @GetMapping("/projects/{projectId}/progress")
    public Result<List<CourseProjectProgress>> listProjectProgress(@PathVariable String projectId) {
        QueryWrapper<CourseProjectProgress> qw = new QueryWrapper<>();
        qw.eq("project_id", projectId);
        qw.orderByAsc("created_at");
        return Result.ok(projectProgressMapper.selectList(qw));
    }

    /**
     * POST /api/projects/{projectId}/progress  学生提交/更新自己的进度
     * body: { id?, studentId, progressType, status, comment?, attachments? }
     * 幂等：同一项目同一学生同一类型只保留一条，重复提交则更新
     */
    @PostMapping("/projects/{projectId}/progress")
    public Result<CourseProjectProgress> upsertProjectProgress(
            @PathVariable String projectId,
            @RequestBody CourseProjectProgress progress) {
        progress.setProjectId(projectId);
        QueryWrapper<CourseProjectProgress> qw = new QueryWrapper<>();
        qw.eq("project_id", projectId)
                .eq("student_id", progress.getStudentId() == null ? "" : progress.getStudentId())
                .eq("progress_type", progress.getProgressType() == null ? "" : progress.getProgressType());
        CourseProjectProgress exist = projectProgressMapper.selectOne(qw);
        if (exist != null) {
            progress.setId(exist.getId());
            if (!StringUtils.hasText(progress.getStatus())) progress.setStatus(exist.getStatus());
            if (progress.getScore() == null) progress.setScore(exist.getScore());
            projectProgressMapper.updateById(progress);
            return Result.ok(projectProgressMapper.selectById(exist.getId()));
        }
        if (!StringUtils.hasText(progress.getId())) {
            progress.setId("pprog-" + System.currentTimeMillis());
        }
        projectProgressMapper.insert(progress);
        return Result.ok(progress);
    }

    /**
     * PUT /api/projects/progress/{id}  教师批改（工单/测试评分）
     * body: { score, comment? }
     */
    @PutMapping("/projects/progress/{id}")
    public Result<CourseProjectProgress> gradeProjectProgress(
            @PathVariable String id,
            @RequestBody CourseProjectProgress data) {
        CourseProjectProgress exist = projectProgressMapper.selectById(id);
        if (exist == null) return Result.fail(404, "进度记录不存在");
        if (data.getScore() != null) exist.setScore(data.getScore());
        if (StringUtils.hasText(data.getComment())) exist.setComment(data.getComment());
        exist.setStatus("graded");
        projectProgressMapper.updateById(exist);
        return Result.ok(projectProgressMapper.selectById(id));
    }

    // ==================== 评教问卷 Questionnaire ====================

    /**
     * GET /api/questionnaire?courseId=xxx  课程评教问卷（无则 null）
     */
    @GetMapping("/questionnaire")
    public Result<CourseEvalQuestionnaire> getQuestionnaire(@RequestParam(required = false) String courseId) {
        if (!StringUtils.hasText(courseId)) return Result.ok(null);
        QueryWrapper<CourseEvalQuestionnaire> qw = new QueryWrapper<>();
        qw.eq("course_id", courseId);
        return Result.ok(questionnaireMapper.selectOne(qw));
    }

    /**
     * POST /api/questionnaire  创建/更新评教问卷（同一课程仅一份）
     */
    @PostMapping("/questionnaire")
    public Result<CourseEvalQuestionnaire> saveQuestionnaire(@RequestBody CourseEvalQuestionnaire q) {
        QueryWrapper<CourseEvalQuestionnaire> qw = new QueryWrapper<>();
        qw.eq("course_id", q.getCourseId() == null ? "" : q.getCourseId());
        CourseEvalQuestionnaire exist = questionnaireMapper.selectOne(qw);
        if (exist != null) {
            q.setId(exist.getId());
            questionnaireMapper.updateById(q);
            return Result.ok(questionnaireMapper.selectById(exist.getId()));
        }
        if (!StringUtils.hasText(q.getId())) {
            q.setId("qnr-" + System.currentTimeMillis());
        }
        questionnaireMapper.insert(q);
        return Result.ok(q);
    }

    /**
     * DELETE /api/questionnaire/{id}  删除评教问卷（级联删除填写记录）
     */
    @DeleteMapping("/questionnaire/{id}")
    public Result<Void> deleteQuestionnaire(@PathVariable String id) {
        questionnaireMapper.deleteById(id);
        evalResponseMapper.delete(new QueryWrapper<CourseEvalResponse>().eq("questionnaire_id", id));
        return Result.ok();
    }

    /**
     * GET /api/questionnaire/{id}/responses  问卷全部填写记录
     */
    @GetMapping("/questionnaire/{id}/responses")
    public Result<List<CourseEvalResponse>> listEvalResponses(@PathVariable String id) {
        QueryWrapper<CourseEvalResponse> qw = new QueryWrapper<>();
        qw.eq("questionnaire_id", id);
        qw.orderByAsc("created_at");
        return Result.ok(evalResponseMapper.selectList(qw));
    }

    /**
     * POST /api/questionnaire/{id}/responses  学生提交/更新评教
     * body: { studentId, answers }
     * 幂等：同一学生同一问卷只保留一条
     */
    @PostMapping("/questionnaire/{id}/responses")
    public Result<CourseEvalResponse> submitEvalResponse(
            @PathVariable String id,
            @RequestBody CourseEvalResponse resp) {
        resp.setQuestionnaireId(id);
        QueryWrapper<CourseEvalResponse> qw = new QueryWrapper<>();
        qw.eq("questionnaire_id", id)
                .eq("student_id", resp.getStudentId() == null ? "" : resp.getStudentId());
        CourseEvalResponse exist = evalResponseMapper.selectOne(qw);
        if (exist != null) {
            exist.setAnswers(resp.getAnswers());
            evalResponseMapper.updateById(exist);
            return Result.ok(exist);
        }
        if (!StringUtils.hasText(resp.getId())) {
            resp.setId("resp-" + System.currentTimeMillis());
        }
        evalResponseMapper.insert(resp);
        return Result.ok(resp);
    }
}

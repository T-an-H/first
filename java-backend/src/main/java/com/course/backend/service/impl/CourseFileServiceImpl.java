package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.CourseFile;
import com.course.backend.mapper.CourseFileMapper;
import com.course.backend.service.CourseFileService;
import org.springframework.stereotype.Service;

@Service
public class CourseFileServiceImpl extends ServiceImpl<CourseFileMapper, CourseFile> implements CourseFileService {
}

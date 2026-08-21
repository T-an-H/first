package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.DetailedGrade;
import com.course.backend.mapper.DetailedGradeMapper;
import com.course.backend.service.DetailedGradeService;
import org.springframework.stereotype.Service;

@Service
public class DetailedGradeServiceImpl extends ServiceImpl<DetailedGradeMapper, DetailedGrade> implements DetailedGradeService {
}

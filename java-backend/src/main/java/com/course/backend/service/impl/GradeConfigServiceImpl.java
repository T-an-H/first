package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.GradeConfig;
import com.course.backend.mapper.GradeConfigMapper;
import com.course.backend.service.GradeConfigService;
import org.springframework.stereotype.Service;

@Service
public class GradeConfigServiceImpl extends ServiceImpl<GradeConfigMapper, GradeConfig> implements GradeConfigService {
}

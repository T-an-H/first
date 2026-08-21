package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.EvalConfig;
import com.course.backend.mapper.EvalConfigMapper;
import com.course.backend.service.EvalConfigService;
import org.springframework.stereotype.Service;

@Service
public class EvalConfigServiceImpl extends ServiceImpl<EvalConfigMapper, EvalConfig> implements EvalConfigService {
}

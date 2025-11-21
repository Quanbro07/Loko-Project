package com.exproject.backend.aiAPI.dto;

import com.exproject.backend.makePlan.dto.MakePlanRequest;
import com.exproject.backend.aiAPI.dto.RawLocationDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MakePlanPythonPayload {
    private MakePlanRequest request;
    private List<RawLocationDTO> locations;
}


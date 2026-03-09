package com.company.ems.backend.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> content;
    private int     page;
    private int     size;
    private long    totalElements;
    private int     totalPages;
    private String  displayInfo;

    public static <T> PageResponse<T> of(Page<T> springPage) {
        return of(springPage, "results");
    }

    public static <T> PageResponse<T> of(Page<T> springPage, String entityName) {
        int  p     = springPage.getNumber();
        int  s     = springPage.getSize();
        long total = springPage.getTotalElements();
        int  pages = springPage.getTotalPages();

        int from = total == 0 ? 0 : p * s + 1;
        int to   = (int) Math.min((long)(p + 1) * s, total);

        return PageResponse.<T>builder()
                .content(springPage.getContent())
                .page(p).size(s)
                .totalElements(total).totalPages(pages)
                .displayInfo(String.format("Showing %d-%d of %d %s", from, to, total, entityName))
                .build();
    }
    public static <T> PageResponse<T> of(
            List<T> content,
            int page, int size,
            long totalElements, int totalPages,
            String entityName) {

        int from = totalElements == 0 ? 0 : page * size + 1;
        int to   = (int) Math.min((long)(page + 1) * size, totalElements);

        return PageResponse.<T>builder()
                .content(content)
                .page(page).size(size)
                .totalElements(totalElements).totalPages(totalPages)
                .displayInfo(String.format("Showing %d-%d of %d %s", from, to, totalElements, entityName))
                .build();
    }
}
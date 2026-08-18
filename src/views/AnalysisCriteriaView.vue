<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard.vue'
import { REGIONS } from '@/constants/regions'
import { RISK_INDEX_LEVELS } from '@/utils/riskLevels'

interface RiskFactorDoc {
  label: string
  description: string
}

const riskFactors: RiskFactorDoc[] = [
  {
    label: '주차 수요 압박',
    description: '시간대별 주차 수요 대비 공급 부족 정도. 출퇴근 피크(오전 9시·오후 6시 전후)에 가중치가 높아집니다.',
  },
  {
    label: '환경 민감도',
    description: '보행·생활 환경에 미치는 영향 민감도. 주거 밀집도와 생활 동선을 반영합니다.',
  },
  {
    label: '교통 혼잡도',
    description: '격자 주변 도로의 혼잡 수준. 주차 수요가 도로 정체로 전이되는 정도를 나타냅니다.',
  },
]

/** 등급별 해석 — 구간·색상은 지도 범례(RISK_INDEX_LEVELS)를 그대로 따른다 */
const LEVEL_DESCRIPTIONS: Record<string, string> = {
  danger: '상시 주차난 — 개방 대상을 우선 검토할 구간',
  alert: '피크 시간대 주차난이 반복되는 구간',
  caution: '특정 시간대에 수요가 몰리는 구간',
  normal: '수급이 대체로 균형을 이루는 구간',
  smooth: '여유 있는 구간',
}

/**
 * 위험 등급 표 — 지도 범례와 같은 5단계를 같은 색상·경계로 표시한다.
 * 구간 문자열은 범례가 쓰는 상한 표기(rangeLabel) 대신, 문서용으로 하한–상한을 함께 적는다.
 */
const riskLevels = RISK_INDEX_LEVELS.map((level, index) => {
  const upper = RISK_INDEX_LEVELS[index - 1]?.minScore
  const range =
    upper === undefined
      ? `${level.minScore}점 이상`
      : Number.isFinite(level.minScore)
        ? `${level.minScore}–${upper}점`
        : `${upper}점 미만`
  return { ...level, range, description: LEVEL_DESCRIPTIONS[level.key] ?? '' }
})

const regionLabels = REGIONS.map((region) => region.label).join(', ')
</script>

<template>
  <div class="analysis-criteria-view">
    <header class="analysis-criteria-view__header">
      <h2 class="analysis-criteria-view__title">
        분석 기준
      </h2>
      <p class="analysis-criteria-view__subtitle">
        CoolingVerse가 주차 위험지수를 산출하고 시나리오 효과를 반영하는 방법을 설명합니다.
      </p>
    </header>

    <BaseCard title="분석 개요">
      <p class="analysis-criteria-view__paragraph">
        CoolingVerse는 아파트 주차장 개방 정책이 지역 주차난에 미치는 효과를 격자 단위로
        시뮬레이션합니다. 분석 대상 지역을 일정 크기의 격자로 나누어 격자마다
        <strong>위험지수(0–100점)</strong>를 산출하고, 개방 시나리오(개방 대상·참여율·운영
        시간)를 적용했을 때의 예상 변화를 함께 보여줍니다.
      </p>
    </BaseCard>

    <BaseCard title="위험지수 산출 방식">
      <p class="analysis-criteria-view__paragraph">
        격자 위험지수는 아래 세 가지 구성요소를 종합해 0–100점으로 산출합니다. 대시보드의
        글로벌 위험지수는 위험지수를 보유한 전체 격자의 평균값입니다.
      </p>
      <dl class="analysis-criteria-view__factor-list">
        <div
          v-for="factor in riskFactors"
          :key="factor.label"
          class="analysis-criteria-view__factor"
        >
          <dt class="analysis-criteria-view__factor-label">
            {{ factor.label }}
          </dt>
          <dd class="analysis-criteria-view__factor-desc">
            {{ factor.description }}
          </dd>
        </div>
      </dl>

      <h4 class="analysis-criteria-view__section-title">
        위험 등급 구간
      </h4>
      <table class="analysis-criteria-view__table">
        <thead>
          <tr>
            <th scope="col">
              등급
            </th>
            <th scope="col">
              점수 구간
            </th>
            <th scope="col">
              해석
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in riskLevels"
            :key="row.key"
          >
            <td>
              <span class="analysis-criteria-view__level">
                <i
                  class="analysis-criteria-view__level-dot"
                  :style="{ backgroundColor: row.color }"
                />
                {{ row.label }}
              </span>
            </td>
            <td class="analysis-criteria-view__range">
              {{ row.range }}
            </td>
            <td>{{ row.description }}</td>
          </tr>
        </tbody>
      </table>
      <p class="analysis-criteria-view__caption">
        지도 범례와 같은 기준입니다.
      </p>
    </BaseCard>

    <BaseCard title="격자 기준">
      <ul class="analysis-criteria-view__list">
        <li>
          분석 대상은 현재 <strong>{{ regionLabels }}</strong> {{ REGIONS.length }}곳이며,
          지역별로 정의된 분석 영역 내부만 산출 대상입니다.
        </li>
        <li>
          위험지수는 <strong>주차 수요·공급이 실제로 관측되는 격자</strong>에만 부여합니다.
          아파트가 있거나, 대기질 측정점이 있거나, 연간 단속이 일정 건수 이상인 격자가
          대상이며, 산·하천처럼 주차 수요가 없는 격자는 제외합니다.
        </li>
        <li>
          지도에는 <strong>위험지수를 보유한 격자만</strong> 표시됩니다. 격자 수는 지역
          면적과 밀집도에 따라 다릅니다.
        </li>
        <li>
          줌 레벨에 따라 인접 격자를 클러스터로 묶어 표시하며, 클러스터 값은 소속 격자
          위험지수의 평균입니다.
        </li>
      </ul>
    </BaseCard>

    <BaseCard title="시나리오 효과 반영">
      <p class="analysis-criteria-view__paragraph">
        미개방 단지의 유휴 주차면 중 <strong>예상 참여율(%)</strong>만큼이 공급에 추가된다고
        보고, 늘어난 공급으로 격자 공급 부족을 다시 계산해 위험지수 감소폭을 구합니다.
        감소폭은 참여율에 비례하며, 지역별 계수는 적재된 해당 지역 데이터에서 산출합니다.
      </p>
      <p class="analysis-criteria-view__paragraph">
        현재 버전은 산출된 감소폭을 <strong>전 격자·전 시간대에 동일하게</strong> 적용합니다.
        격자 특성별 차등 반영은 분석 모델 고도화 과제로 남아 있습니다.
      </p>
    </BaseCard>

    <BaseCard title="지표 정의">
      <ul class="analysis-criteria-view__list">
        <li>
          <strong>유휴 주차 공급 가능 대수</strong>와 <strong>탄소배출 저감</strong>은 단지별
          주차면수와 개방 참여율에서 직접 산출한 값입니다.
        </li>
        <li>
          <strong>불법주정차 감소</strong>와 <strong>교통 혼잡 완화</strong>는 전용 산식이
          확정되기 전이라 <strong>위험지수 감소율에 기반한 근사치</strong>입니다. 정책 효과의
          방향과 상대적 크기를 보는 용도로 해석해 주십시오.
        </li>
      </ul>
    </BaseCard>

    <BaseCard title="데이터 출처 · 기준 시점">
      <ul class="analysis-criteria-view__list">
        <li>
          분석은 <strong>직전 년도 데이터</strong>를 기준으로 하며, 분석 기준 월을 선택해
          해당 월의 패턴으로 조회합니다.
        </li>
        <li>
          시간대는 00–23시 24개 구간으로 나뉘며, 출퇴근 이중 피크(M-커브) 패턴이
          반영됩니다.
        </li>
        <li>
          격자 위험지수·시뮬레이션 결과는 CoolingVerse 백엔드 분석 모델이 산출하며, 백엔드
          장애 또는 데이터 미보유 지역 조회 시에는 화면에 개발용 예시 데이터임을 표시합니다.
        </li>
      </ul>
      <p class="analysis-criteria-view__note">
        산출 방식과 기준은 분석 모델 고도화에 따라 변경될 수 있습니다.
      </p>
    </BaseCard>
  </div>
</template>

<style scoped lang="scss">
.analysis-criteria-view {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  // 본문은 읽기 좋은 폭으로 제한하되, 넓은 화면에서 좌측으로 쏠리지 않게 가운데 정렬한다
  max-width: 880px;
  margin: 0 auto;

  &__header {
    margin-bottom: $space-1;
  }

  &__title {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-text;
  }

  &__subtitle {
    margin-top: $space-1;
    font-size: $font-size-base;
    color: $color-text-secondary;
  }

  &__paragraph {
    font-size: $font-size-base;
    line-height: 1.7;
    color: $color-text-secondary;

    strong {
      color: $color-text;
      font-weight: 600;
    }

    + .analysis-criteria-view__paragraph {
      margin-top: $space-3;
    }
  }

  &__section-title {
    margin-top: $space-5;
    margin-bottom: $space-3;
    font-size: $font-size-base;
    font-weight: 600;
    color: $color-text;
  }

  &__factor-list {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    margin-top: $space-4;
  }

  &__factor {
    padding: $space-3 $space-4;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    background: $color-bg;
  }

  &__factor-label {
    font-size: $font-size-base;
    font-weight: 600;
    color: $color-text;
  }

  &__factor-desc {
    margin-top: $space-1;
    font-size: $font-size-sm;
    line-height: 1.6;
    color: $color-text-secondary;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: $font-size-sm;

    th {
      padding: $space-2 $space-3;
      text-align: left;
      font-weight: 600;
      color: $color-text-secondary;
      background: $color-bg;
      border-bottom: 1px solid $color-border;

      // 등급·구간 열은 내용 폭에 맞추고 해석 열이 남는 폭을 가져간다
      &:first-child {
        width: 88px;
      }

      &:nth-child(2) {
        width: 116px;
      }
    }

    td {
      padding: $space-2 $space-3;
      color: $color-text;
      border-bottom: 1px solid $color-border;
      vertical-align: middle;
    }
  }

  &__range {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    color: $color-text-secondary;
  }

  &__level {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    font-weight: 600;
    white-space: nowrap;
  }

  &__level-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__caption {
    margin-top: $space-2;
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    padding-left: $space-4;
    font-size: $font-size-base;
    line-height: 1.7;
    color: $color-text-secondary;
    list-style: disc;

    strong {
      color: $color-text;
      font-weight: 600;
    }
  }

  &__note {
    margin-top: $space-4;
    padding: $space-2 $space-3;
    border-radius: $radius-md;
    background: $color-primary-soft;
    font-size: $font-size-xs;
    color: $color-primary;
  }
}
</style>

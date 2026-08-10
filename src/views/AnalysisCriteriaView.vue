<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard.vue'
import { REGIONS } from '@/constants/regions'

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

interface RiskLevelDoc {
  level: 'high' | 'medium' | 'low'
  label: string
  range: string
  description: string
}

const riskLevels: RiskLevelDoc[] = [
  { level: 'high', label: 'High', range: '65점 이상', description: '주의 — 시나리오 적용을 통한 완화가 필요한 구간' },
  { level: 'medium', label: 'Med', range: '40–65점', description: '보통 — 시나리오 적용 시 완화 여지가 있는 구간' },
  { level: 'low', label: 'Low', range: '40점 미만', description: '원활 — 낮은 위험 수준' },
]

/** 참여율 → 위험지수 감소폭 앵커 표 — 백엔드 SimulationService와 동일 값 */
const participationAnchors = [
  { rate: 0, delta: 0 },
  { rate: 10, delta: 0.36 },
  { rate: 30, delta: 0.96 },
  { rate: 50, delta: 1.31 },
  { rate: 70, delta: 1.52 },
  { rate: 100, delta: 1.68 },
]

const regionLabels = REGIONS.map((r) => r.label).join(', ')
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
            :key="row.level"
          >
            <td>
              <span
                class="analysis-criteria-view__level"
                :class="`analysis-criteria-view__level--${row.level}`"
              >
                {{ row.label }}
              </span>
            </td>
            <td>{{ row.range }}</td>
            <td>{{ row.description }}</td>
          </tr>
        </tbody>
      </table>
    </BaseCard>

    <BaseCard title="격자 기준">
      <ul class="analysis-criteria-view__list">
        <li>
          분석 대상 지역은 현재 <strong>{{ regionLabels }}</strong> 2곳이며, 지역별로 정의된
          분석 영역(바운딩박스) 내부만 산출 대상입니다.
        </li>
        <li>
          지도에는 <strong>위험지수를 보유한 격자만</strong> 표시됩니다 (판교 기준 1,306개).
          데이터가 없는 격자는 응답과 지도 모두에서 제외됩니다.
        </li>
        <li>
          줌 레벨에 따라 인접 격자를 클러스터로 묶어 표시하며, 클러스터 값은 소속 격자
          위험지수의 평균입니다.
        </li>
      </ul>
    </BaseCard>

    <BaseCard title="시나리오 효과 반영">
      <p class="analysis-criteria-view__paragraph">
        예상 참여율(%)에 따라 위험지수 감소폭이 결정됩니다. 개방 효과는
        <strong>수확 체감</strong> 형태로, 참여율이 높아질수록 추가 감소폭은 줄어듭니다.
        아래 앵커 구간 사이 값은 선형 보간하며, 산출된 감소폭은 전 격자·전 시간대에
        동일하게 적용됩니다.
      </p>
      <table class="analysis-criteria-view__table analysis-criteria-view__table--narrow">
        <thead>
          <tr>
            <th scope="col">
              참여율(%)
            </th>
            <th scope="col">
              위험지수 감소폭(점)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="anchor in participationAnchors"
            :key="anchor.rate"
          >
            <td>{{ anchor.rate }}</td>
            <td>{{ anchor.delta.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </BaseCard>

    <BaseCard title="데이터 출처 · 기준 시점">
      <ul class="analysis-criteria-view__list">
        <li>
          분석은 <strong>직전 년도 데이터</strong>를 기준으로 하며, 분석 기준 월(1–12월)을
          선택해 해당 월의 패턴으로 조회합니다.
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
  max-width: 880px;

  &__header {
    margin-bottom: $space-2;
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

    &--narrow {
      max-width: 420px;
      margin-top: $space-4;
    }

    th {
      padding: $space-2 $space-3;
      text-align: left;
      font-weight: 600;
      color: $color-text-secondary;
      background: $color-bg;
      border-bottom: 1px solid $color-border;
    }

    td {
      padding: $space-2 $space-3;
      color: $color-text;
      border-bottom: 1px solid $color-border;
      font-variant-numeric: tabular-nums;
    }
  }

  &__level {
    font-weight: 600;

    &--high {
      color: $color-danger;
    }

    &--medium {
      color: $color-warning;
    }

    &--low {
      color: $color-primary;
    }
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
